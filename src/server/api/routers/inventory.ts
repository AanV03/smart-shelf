import { z } from "zod";
import { createTRPCRouter, protectedProcedureWithStore } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const inventoryRouter = createTRPCRouter({
  /**
   * Get all products for the user's store
   */
  getProducts: protectedProcedureWithStore.query(async ({ ctx }) => {
    // ✅ defaultStoreId is guaranteed to exist from protectedProcedureWithStore
    const storeId = ctx.defaultStoreId;

    return ctx.db.product.findMany({
      where: { storeId: storeId },
      include: { Category: true },
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Get batches for a product or all batches
   */
  getBatches: protectedProcedureWithStore
    .input(
      z.object({
        productId: z.string().optional(),
        status: z.enum(["ACTIVE", "EXPIRED", "SOLD", "SPOILED"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        storeId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // ✅ Multi-tenant: Get store from input or use default from middleware
      const requestedStoreId = input.storeId ?? ctx.defaultStoreId;
      
      // ✅ SECURITY: Verify user has access to requested store
      const hasAccess = ctx.session.user.stores?.some(s => s.id === requestedStoreId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have access to this store",
        });
      }

      const where = {
        storeId: requestedStoreId,
        ...(input.productId && { productId: input.productId }),
        ...(input.status && { status: input.status }),
      };

      const batches = await ctx.db.batch.findMany({
        where,
        include: { Product: { include: { Category: true } }, User: true },
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
  getTotalInventoryValue: protectedProcedureWithStore.query(async ({ ctx }) => {
    // ✅ defaultStoreId is guaranteed to exist from protectedProcedureWithStore
    const storeId = ctx.defaultStoreId;

    const result = await ctx.db.batch.aggregate({
      where: {
        storeId: storeId,
        status: "ACTIVE",
      },
      _sum: { totalCost: true },
    });

    return { totalValue: result._sum.totalCost ?? 0 };
  }),

  /**
   * Get batches expiring soon (within N days)
   */
  getExpiringBatches: protectedProcedureWithStore
    .input(z.object({ daysThreshold: z.number().default(3) }))
    .query(async ({ ctx, input }) => {
      const storeId = ctx.defaultStoreId;

      const now = new Date();
      const futureDate = new Date(now.getTime() + input.daysThreshold * 24 * 60 * 60 * 1000);

      return ctx.db.batch.findMany({
        where: {
          storeId: storeId,
          status: "ACTIVE",
          expiresAt: {
            lte: futureDate,
            gte: now,
          },
        },
        include: { Product: { include: { Category: true } } },
        orderBy: { expiresAt: "asc" },
      });
    }),

  /**
   * Create a new batch
   */
  createBatch: protectedProcedureWithStore
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
      const storeId = ctx.defaultStoreId;

      // Verify product exists and belongs to store
      const product = await ctx.db.product.findFirst({
        where: {
          id: input.productId,
          storeId: storeId,
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
          storeId: storeId,
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
          storeId: storeId,
          createdById: ctx.session.user.id!,
        },
        include: { Product: { include: { Category: true } }, User: true },
      });
    }),

  /**
   * Mark batch as expired
   */
  markBatchExpired: protectedProcedureWithStore
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.defaultStoreId;

      const batch = await ctx.db.batch.findFirst({
        where: {
          id: input.batchId,
          storeId: storeId,
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
        include: { Product: { include: { Category: true } } },
      });
    }),

  /**
   * Update batch status
   */
  updateBatchStatus: protectedProcedureWithStore
    .input(
      z.object({
        batchId: z.string(),
        status: z.enum(["ACTIVE", "EXPIRED", "SOLD", "SPOILED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.defaultStoreId;

      const batch = await ctx.db.batch.findFirst({
        where: {
          id: input.batchId,
          storeId: storeId,
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
        include: { Product: { include: { Category: true } } },
      });
    }),

  /**
   * Delete a batch
   */
  deleteBatch: protectedProcedureWithStore
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.defaultStoreId;

      const batch = await ctx.db.batch.findFirst({
        where: {
          id: input.id,
          storeId: storeId,
        },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      return ctx.db.batch.delete({
        where: { id: input.id },
      });
    }),
});
