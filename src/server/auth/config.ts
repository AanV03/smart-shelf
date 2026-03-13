import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
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
      role: string;
      storeId: string | null;
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    storeId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    storeId?: string | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    }),
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsedCredentials.data.email },
        });

        if (!user?.password) {
          return null;
        }

        const passwordsMatch = await compare(
          parsedCredentials.data.password,
          user.password
        );

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          storeId: user.storeId,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(db) as any, // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      console.log("[AUTH_JWT]", {
        trigger,
        hasUser: !!user,
        hasSession: !!session,
      });

      // Cuando el usuario hace login por primera vez
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "EMPLOYEE";
        token.storeId = (user as any).storeId;
        console.log("[AUTH_JWT] Token created with user:", {
          userId: user.id,
          role: (user as any).role,
          storeId: (user as any).storeId,
        });
      }

      // Cuando se actualiza la sesión (en el callback session)
      if (trigger === "update" && session) {
        token.role = session.user.role;
        token.storeId = session.user.storeId;
        console.log("[AUTH_JWT] Token updated:", {
          role: session.user.role,
          storeId: session.user.storeId,
        });
      }

      return token;
    },
    signIn: async ({ user, account }) => {
      // Log para debugging
      console.log("[AUTH_SIGNIN]", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        hasStoreId: !!(user as any).storeId,
      });

      // Si el usuario no tiene una store asignada, crear una automáticamente
      if (!(user as any).storeId) {
        try {
          // Crear una store por defecto para el usuario
          const store = await db.store.create({
            data: {
              name: `${user.name || user.email?.split("@")[0] || "Store"}'s Store`,
              location: "Default Location",
            },
          });

          // Actualizar el usuario con la store
          const updatedUser = await db.user.update({
            where: { id: user.id },
            data: { storeId: store.id },
          });

          // Actualizar el objeto user con el nuevo storeId
          (user as any).storeId = updatedUser.storeId;
          console.log("[AUTH_SIGNIN] Store created and assigned:", updatedUser.storeId);
        } catch (error) {
          console.error("[AUTH_SIGNIN_ERROR] Error creating store:", error);
          // No fallar el signin, solo logear el error
          return true;
        }
      }
      return true;
    },
    session: async ({ session, token }) => {
      console.log("[AUTH_SESSION] Token data:", {
        id: token.id,
        role: token.role,
        storeId: token.storeId,
      });

      // Copiamos los datos del token JWT a la sesión
      session.user.id = token.id as string;
      session.user.role = (token.role as string) || "EMPLOYEE";
      session.user.storeId = (token.storeId as string) || null;

      // Si el usuario no tiene storeId, tratar de obtenerlo de la BD
      if (!session.user.storeId && token.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { storeId: true },
          });

          if (dbUser?.storeId) {
            session.user.storeId = dbUser.storeId;
            console.log("[AUTH_SESSION] StoreId found in database:", dbUser.storeId);
          } else if (dbUser?.id) {
            // Si el usuario existe pero no tiene storeId, crear uno
            const store = await db.store.create({
              data: {
                name: `${session.user.name || session.user.email?.split("@")[0] || "Store"}'s Store`,
                location: "Default Location",
              },
            });

            const updatedUser = await db.user.update({
              where: { id: token.id as string },
              data: { storeId: store.id },
            });

            session.user.storeId = updatedUser.storeId;
            console.log("[AUTH_SESSION] Store created in session callback:", store.id);
          }
        } catch (error) {
          console.error("[AUTH_SESSION_ERROR] Error handling storeId:", error);
        }
      }

      console.log("[AUTH_SESSION] Final session:", {
        userId: session.user.id,
        email: session.user.email,
        storeId: session.user.storeId,
        role: session.user.role,
      });

      return session;
    },
  },
} satisfies NextAuthConfig;
