import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const alertsRouter = createTRPCRouter({
  /**
   * Get all alerts for the user's store
   */
  getAlerts: protectedProcedure
    .input(
      z.object({
        isRead: z.boolean().optional(),
        severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const where = {
        storeId: storeId,
        ...(input.isRead !== undefined && { isRead: input.isRead }),
        ...(input.severity && { severity: input.severity }),
      };

      const alerts = await ctx.db.alert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.alert.count({ where });

      return {
        alerts,
        total,
        pageInfo: { limit: input.limit, offset: input.offset },
      };
    }),

  /**
   * Get count of unread alerts
   */
  getUnreadAlertsCount: protectedProcedure.query(async ({ ctx }) => {
    const storeId = ctx.session.user.stores?.[0]?.id;

    if (!storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    const count = await ctx.db.alert.count({
      where: {
        storeId: storeId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }),

  /**
   * Get count of critical alerts
   */
  getCriticalAlertsCount: protectedProcedure.query(async ({ ctx }) => {
    const storeId = ctx.session.user.stores?.[0]?.id;

    if (!storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    const count = await ctx.db.alert.count({
      where: {
        storeId: storeId,
        severity: "CRITICAL",
        isRead: false,
      },
    });

    return { criticalCount: count };
  }),

  /**
   * Mark alert as read
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const alert = await ctx.db.alert.findFirst({
        where: {
          id: input.alertId,
          storeId: storeId,
        },
      });

      if (!alert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert not found",
        });
      }

      return ctx.db.alert.update({
        where: { id: input.alertId },
        data: { isRead: true },
      });
    }),

  /**
   * Delete/dismiss alert
   */
  dismissAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const alert = await ctx.db.alert.findFirst({
        where: {
          id: input.alertId,
          storeId: storeId,
        },
      });

      if (!alert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert not found",
        });
      }

      await ctx.db.alert.delete({
        where: { id: input.alertId },
      });

      return { success: true };
    }),

  /**
   * Create an alert (internal only, not exposed to frontend in typical flow)
   */
  createAlert: protectedProcedure
    .input(
      z.object({
        type: z.enum(["EXPIRING_SOON", "EXPIRED", "LOW_STOCK"]),
        severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
        message: z.string().min(1),
        batchId: z.string().optional(),
        productId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      return ctx.db.alert.create({
        data: {
          type: input.type,
          severity: input.severity,
          message: input.message,
          batchId: input.batchId,
          productId: input.productId,
          storeId: storeId,
        },
      });
    }),
});
