import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const inventoryRouter = createTRPCRouter({
  /**
   * Get all products for the user's store
   */
  getProducts: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    return ctx.db.product.findMany({
      where: { storeId: ctx.session.user.storeId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Get batches for a product or all batches
   */
  getBatches: protectedProcedure
    .input(
      z.object({
        productId: z.string().optional(),
        status: z.enum(["ACTIVE", "EXPIRED", "SOLD", "SPOILED"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const where = {
        storeId: ctx.session.user.storeId,
        ...(input.productId && { productId: input.productId }),
        ...(input.status && { status: input.status }),
      };

      const batches = await ctx.db.batch.findMany({
        where,
        include: { product: { include: { category: true } }, createdBy: true },
        orderBy: { expiresAt: "asc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.batch.count({ where });

      return { batches, total, pageInfo: { limit: input.limit, offset: input.offset } };
    }),

  /**
   * Get total inventory value (sum of totalCost for ACTIVE batches)
   */
  getTotalInventoryValue: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    const result = await ctx.db.batch.aggregate({
      where: {
        storeId: ctx.session.user.storeId,
        status: "ACTIVE",
      },
      _sum: { totalCost: true },
    });

    return { totalValue: result._sum.totalCost ?? 0 };
  }),

  /**
   * Get batches expiring soon (within N days)
   */
  getExpiringBatches: protectedProcedure
    .input(z.object({ daysThreshold: z.number().default(3) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const now = new Date();
      const futureDate = new Date(now.getTime() + input.daysThreshold * 24 * 60 * 60 * 1000);

      return ctx.db.batch.findMany({
        where: {
          storeId: ctx.session.user.storeId,
          status: "ACTIVE",
          expiresAt: {
            lte: futureDate,
            gte: now,
          },
        },
        include: { product: { include: { category: true } } },
        orderBy: { expiresAt: "asc" },
      });
    }),

  /**
   * Create a new batch
   */
  createBatch: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        batchNumber: z.string().min(1),
        quantity: z.number().int().positive(),
        costPerUnit: z.number().positive(),
        expiresAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      // Verify product exists and belongs to store
      const product = await ctx.db.product.findFirst({
        where: {
          id: input.productId,
          storeId: ctx.session.user.storeId,
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check batch number uniqueness within store
      const existingBatch = await ctx.db.batch.findFirst({
        where: {
          batchNumber: input.batchNumber,
          storeId: ctx.session.user.storeId,
        },
      });

      if (existingBatch) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Batch number already exists in this store",
        });
      }

      const totalCost = input.quantity * input.costPerUnit;

      return ctx.db.batch.create({
        data: {
          batchNumber: input.batchNumber,
          productId: input.productId,
          quantity: input.quantity,
          costPerUnit: input.costPerUnit,
          totalCost,
          expiresAt: input.expiresAt,
          status: "ACTIVE",
          storeId: ctx.session.user.storeId,
          createdById: ctx.session.user.id,
        },
        include: { product: { include: { category: true } }, createdBy: true },
      });
    }),

  /**
   * Mark batch as expired
   */
  markBatchExpired: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const batch = await ctx.db.batch.findFirst({
        where: {
          id: input.batchId,
          storeId: ctx.session.user.storeId,
        },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      return ctx.db.batch.update({
        where: { id: input.batchId },
        data: { status: "EXPIRED" },
        include: { product: { include: { category: true } } },
      });
    }),

  /**
   * Update batch status
   */
  updateBatchStatus: protectedProcedure
    .input(
      z.object({
        batchId: z.string(),
        status: z.enum(["ACTIVE", "EXPIRED", "SOLD", "SPOILED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const batch = await ctx.db.batch.findFirst({
        where: {
          id: input.batchId,
          storeId: ctx.session.user.storeId,
        },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      return ctx.db.batch.update({
        where: { id: input.batchId },
        data: { status: input.status },
        include: { product: { include: { category: true } } },
      });
    }),
});
