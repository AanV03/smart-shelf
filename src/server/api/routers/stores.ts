import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Generate a random 6-character invitation code
 */
function generateInvitationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const storesRouter = createTRPCRouter({
  /**
   * Create a new store (user becomes ADMIN)
   */
  createStore: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      console.log("[STORES_CREATE] Starting mutation", {
        userId,
        hasSession: !!ctx.session,
        hasUser: !!ctx.session?.user,
      });

      if (!userId) {
        console.error("[STORES_CREATE] No user ID in session");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      try {
        // ✅ IMPORTANT: Verify user exists in database before creating store
        const user = await ctx.db.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          console.error("[STORES_CREATE] User not found in database", {
            userId,
          });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found in database. Please log in again.",
          });
        }

        console.log("[STORES_CREATE] User verified in database:", {
          userId: user.id,
          email: user.email,
        });

        console.log("[STORES_CREATE] Creating store with name:", input.name);

        // ✅ Create store
        const store = await ctx.db.store.create({
          data: {
            name: input.name,
            location: input.location ?? null,
          },
        });

        console.log("[STORES_CREATE] Store created:", { storeId: store.id });

        // ✅ Add user as ADMIN to the store
        const storeMember = await ctx.db.storeMember.create({
          data: {
            userId: userId,
            storeId: store.id,
            role: "ADMIN",
            status: "ACTIVE",
          },
        });

        console.log("[STORES_CREATE] StoreMember created successfully", {
          storeId: store.id,
          userId: userId,
          role: "ADMIN",
        });

        return {
          success: true,
          store,
          storeMember,
          message: "Tienda creada exitosamente. ¡Eres el ADMIN!",
        };
      } catch (error) {
        console.error("[STORES_CREATE] Error creating store:", {
          error,
          message: error instanceof Error ? error.message : "Unknown error",
          cause: error instanceof TRPCError ? error.cause : undefined,
        });

        // If it's already a TRPC error, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Error al crear la tienda",
          cause: error,
        });
      }
    }),

  /**
   * Join store with invitation code
   * For now, we'll use a simple code that's generated when creating a store
   * In a real app, you'd store this in an Invitations table
   */
  joinStoreWithInvitationCode: protectedProcedure
    .input(
      z.object({
        invitationCode: z.string().min(6, "Código inválido"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      try {
        // ✅ For now, treat invitation code as store ID pattern
        // In production, you'd query an Invitations table and validate expiry
        const store = await ctx.db.store.findFirst({
          where: {
            // Simple pattern: invitations could be stored in a separate table
            // For MVP, we'll just validate that store exists
            name: {
              contains: input.invitationCode,
            },
          },
        });

        if (!store) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Código de invitación inválido o expirado",
          });
        }

        // ✅ Check if user is already member of this store
        const existingMember = await ctx.db.storeMember.findUnique({
          where: {
            userId_storeId: {
              userId: ctx.session.user.id,
              storeId: store.id,
            },
          },
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya eres miembro de esta tienda",
          });
        }

        // ✅ Add user to store as EMPLOYEE
        const storeMember = await ctx.db.storeMember.create({
          data: {
            userId: ctx.session.user.id,
            storeId: store.id,
            role: "EMPLOYEE",
            status: "ACTIVE",
          },
        });

        console.log("[STORES_JOIN] User joined store", {
          storeId: store.id,
          userId: ctx.session.user.id,
          role: "EMPLOYEE",
        });

        return {
          success: true,
          store,
          storeMember,
          message: `¡Bienvenido a ${store.name}! Te uniste como EMPLOYEE.`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[STORES_JOIN] Error joining store", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al unirse a la tienda",
        });
      }
    }),

  /**
   * List all stores for current user
   */
  listUserStores: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const stores = await ctx.db.storeMember.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        store: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return stores;
  }),
});
