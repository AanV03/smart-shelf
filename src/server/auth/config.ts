import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import { env } from "@/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      status: string;
      // NEW: Multi-tenant - array of stores with roles
      stores: Array<{
        id: string;
        name: string;
        role: "ADMIN" | "MANAGER" | "EMPLOYEE" | "PENDING";
        status: "ACTIVE" | "INACTIVE" | "INVITED";
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    status: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */

console.log("[AUTH_CONFIG] Building authConfig with environment:", {
  hasDiscordId: !!env.AUTH_DISCORD_ID?.trim(),
  hasDiscordSecret: !!env.AUTH_DISCORD_SECRET?.trim(),
  hasGoogleId: !!env.AUTH_GOOGLE_ID?.trim(),
  hasGoogleSecret: !!env.AUTH_GOOGLE_SECRET?.trim(),
  hasSecret: !!env.AUTH_SECRET,
});

const providers = [];

// Discord OAuth - only enable if BOTH ID and SECRET are set
if (env.AUTH_DISCORD_ID?.trim() && env.AUTH_DISCORD_SECRET?.trim()) {
  console.log("[AUTH_CONFIG] Adding Discord provider");
  providers.push(
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    })
  );
}

// Google OAuth - only enable if BOTH ID and SECRET are set
if (env.AUTH_GOOGLE_ID?.trim() && env.AUTH_GOOGLE_SECRET?.trim()) {
  console.log("[AUTH_CONFIG] Adding Google provider");
  providers.push(
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Credentials provider - always available
providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "user@example.com" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      console.log("[AUTH_CREDENTIALS] Attempting login with:", { email: credentials?.email });
      
      // Validate input
      const parsedCredentials = z
        .object({ email: z.string().email(), password: z.string().min(6) })
        .safeParse(credentials);

      if (!parsedCredentials.success) {
        console.warn("[AUTH_CREDENTIALS] Invalid credentials format");
        return null;
      }

      const user = await db.user.findUnique({
        where: { email: parsedCredentials.data.email },
      });

      if (!user?.password) {
        console.warn("[AUTH_CREDENTIALS] User not found or no password");
        return null;
      }

      // Check if user account is suspended or deleted
      if (user.status !== "ACTIVE") {
        console.warn("[AUTH_CREDENTIALS] User account is not active:", {
          userId: user.id,
          status: user.status,
        });
        return null;
      }

      const passwordsMatch = await compare(
        parsedCredentials.data.password,
        user.password
      );

      if (!passwordsMatch) {
        console.warn("[AUTH_CREDENTIALS] Password mismatch");
        return null;
      }

      console.log("[AUTH_CREDENTIALS] User authenticated successfully:", { userId: user.id });
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        status: user.status,
      };
    },
  })
);

console.log("[AUTH_CONFIG] Total providers configured:", providers.length);

export const authOptions: NextAuthOptions = {
  // For JWT strategy with OAuth, we don't use adapter
  // Instead we handle user creation in signIn callback
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[AUTH_SIGNIN] Attempting sign-in", {
        userId: user?.id,
        email: user?.email,
        provider: account?.provider,
        isOAuth: !!account,
      });

      // For OAuth providers: Create or update user in database
      if (account && user.email) {
        try {
          console.log("[AUTH_SIGNIN] OAuth - upsert user in DB", {
            email: user.email,
            provider: account.provider,
          });

          // Upsert user - create if doesn't exist, update if exists
          const dbUser = await db.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              status: "ACTIVE",
            },
          });

          console.log("[AUTH_SIGNIN] User upserted successfully", {
            email: user.email,
            dbUserId: dbUser.id,
          });

          // ✅ CRITICAL: Store the correct database ID in the user object
          // This will be passed to jwt() callback
          user.id = dbUser.id;
          (user as any).dbId = dbUser.id; // Force set for safety
        } catch (error) {
          console.error("[AUTH_SIGNIN] Error upserting user", { error });
          throw error;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      console.log("[AUTH_JWT] JWT Callback", {
        hasUser: !!user,
        userId: user?.id,
        tokenId: token.id,
        tokenEmail: token.email,
        provider: account?.provider,
      });

      if (user) {
        // ✅ When user object is passed (login/register), use its ID
        token.id = user.id;
        token.email = user.email || token.email;
        token.status = (user as any)?.status ?? "ACTIVE";

        console.log("[AUTH_JWT] Token updated from user", {
          newTokenId: token.id,
          email: token.email,
        });
      } else if (!token.id && token.email) {
        // ✅ Token refresh or OAuth - need to fetch from DB to get correct ID
        console.log("[AUTH_JWT] No token.id but have email, fetching from DB");
        try {
          const dbUser = await db.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.status = dbUser.status;
            console.log("[AUTH_JWT] Updated token with DB user ID", {
              newTokenId: token.id,
              email: token.email,
            });
          } else {
            console.warn("[AUTH_JWT] User not found by email in DB", {
              email: token.email,
            });
          }
        } catch (error) {
          console.error("[AUTH_JWT] Error fetching user from DB", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH_SESSION] Starting session callback", {
        hasToken: !!token,
        tokenId: token.id,
        tokenEmail: token.email,
      });

      // ✅ Initialize stores array
      session.user.stores = [];

      if (!token.id) {
        console.error("[AUTH_SESSION] No token.id found, cannot load stores", {
          token,
        });
        return session;
      }

      try {
        // ✅ Verify user exists in database before proceeding
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
        });

        if (!dbUser) {
          console.error("[AUTH_SESSION] User not found in database", {
            userId: token.id,
            email: token.email,
          });
          // ✅ Try to find by email as fallback
          const userByEmail = await db.user.findUnique({
            where: { email: token.email as string },
          });
          if (userByEmail) {
            console.log("[AUTH_SESSION] Found user by email, updating token.id", {
              email: token.email,
              dbId: userByEmail.id,
            });
            token.id = userByEmail.id;
          } else {
            console.error("[AUTH_SESSION] User not found by email either", {
              email: token.email,
            });
            session.user.stores = [];
            return session;
          }
        }

        // Set user id and status from token
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        session.user.status = (token.status ?? "ACTIVE") as string;

        console.log("[AUTH_SESSION] Fetching stores for user:", token.id);

        // Fetch stores and roles from StoreMember
        const storeMembers = await db.storeMember.findMany({
          where: { userId: token.id as string },
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        console.log("[AUTH_SESSION] Found store members:", {
          count: storeMembers.length,
          userId: token.id,
        });

        // Map StoreMember to stores array in session
        session.user.stores = storeMembers.map((member) => ({
          id: member.store.id,
          name: member.store.name,
          role: member.role as "ADMIN" | "MANAGER" | "EMPLOYEE" | "PENDING",
          status: member.status as "ACTIVE" | "INACTIVE" | "INVITED",
        }));

        console.log("[AUTH_SESSION] Session built successfully:", {
          userId: session.user.id,
          storeCount: session.user.stores.length,
        });
      } catch (error) {
        console.error("[AUTH_SESSION] Error loading stores:", error);
        session.user.stores = [];
      }

      return session;
    },
  },
};
