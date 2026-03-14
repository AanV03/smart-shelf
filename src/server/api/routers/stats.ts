import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eachDayOfInterval, format, subDays } from "date-fns";

export const statsRouter = createTRPCRouter({
  /**
   * Get dashboard stats (MANAGER only)
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const storeId = ctx.session.user.stores?.[0]?.id;
    const userRole = ctx.session.user.stores?.[0]?.role;

    if (!storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only managers can access dashboard stats",
      });
    }

    // Total inventory value
    const inventoryValue = await ctx.db.batch.aggregate({
      where: {
        storeId: storeId,
        status: "ACTIVE",
      },
      _sum: { totalCost: true },
    });

    // Count active products
    const activeProductCount = await ctx.db.product.count({
      where: { storeId: storeId },
    });

    // Count batches expiring in next 7 days
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringCount = await ctx.db.batch.count({
      where: {
        storeId: storeId,
        status: "ACTIVE",
        expiresAt: {
          lte: weekFromNow,
          gte: now,
        },
      },
    });

    // Count unread alerts
    const alertsUnread = await ctx.db.alert.count({
      where: {
        storeId: storeId,
        isRead: false,
      },
    });

    return {
      totalInventoryValue: inventoryValue._sum.totalCost ?? 0,
      activeProductCount,
      expiringCount,
      alertsUnread,
    };
  }),

  /**
   * Get inventory by category
   */
  getInventoryByCategory: protectedProcedure.query(async ({ ctx }) => {
    const storeId = ctx.session.user.stores?.[0]?.id;
    const userRole = ctx.session.user.stores?.[0]?.role;

    if (!storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only managers can access inventory stats",
      });
    }

    // Get all active batches with product and category info
    const batches = await ctx.db.batch.findMany({
      where: {
        storeId: storeId,
        status: "ACTIVE",
      },
      include: { Product: { include: { Category: true } } },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { category: string; totalValue: number; itemCount: number }
    >();

    for (const batch of batches) {
      const categoryName = batch.Product.Category.name;
      const existing = categoryMap.get(categoryName) ?? {
        category: categoryName,
        totalValue: 0,
        itemCount: 0,
      };

      existing.totalValue += batch.totalCost;
      existing.itemCount += batch.quantity;

      categoryMap.set(categoryName, existing);
    }

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.category.localeCompare(b.category),
    );
  }),

  /**
   * Get expiration trend for the past N days
   */
  getExpirationTrend: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;
      const userRole = ctx.session.user.stores?.[0]?.role;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can access trend stats",
        });
      }

      const endDate = new Date();
      const startDate = subDays(endDate, input.days);

      // Get all batches in the date range
      const batches = await ctx.db.batch.findMany({
        where: {
          storeId: storeId,
          expiresAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { expiresAt: true, quantity: true },
      });

      // Create trend data for each day
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const trendMap = new Map<string, number>();

      for (const date of dateRange) {
        const dateStr = format(date, "yyyy-MM-dd");
        trendMap.set(dateStr, 0);
      }

      // Count batches expiring on each day
      for (const batch of batches) {
        const dateStr = format(batch.expiresAt, "yyyy-MM-dd");
        const existing = trendMap.get(dateStr) ?? 0;
        trendMap.set(dateStr, existing + batch.quantity);
      }

      return Array.from(trendMap.entries()).map(([date, expiringCount]) => ({
        date,
        expiringCount,
      }));
    }),

  /**
   * Get inventory snapshot by batch status
   */
  getInventorySnapshot: protectedProcedure.query(async ({ ctx }) => {
    const storeId = ctx.session.user.stores?.[0]?.id;
    const userRole = ctx.session.user.stores?.[0]?.role;

    if (!storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only managers can access inventory snapshot",
      });
    }

    const statusMap = new Map<string, number>();

    // Count batches by status
    const statuses = ["ACTIVE", "EXPIRED", "SOLD", "SPOILED"] as const;

    for (const status of statuses) {
      const count = await ctx.db.batch.count({
        where: {
          storeId: storeId,
          status,
        },
      });
      statusMap.set(status, count);
    }

    return {
      active: statusMap.get("ACTIVE") ?? 0,
      expired: statusMap.get("EXPIRED") ?? 0,
      sold: statusMap.get("SOLD") ?? 0,
      spoiled: statusMap.get("SPOILED") ?? 0,
    };
  }),
});
