import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const productRouter = createTRPCRouter({
  /**
   * Get all products for user's store
   */
  listProducts: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
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
        ...(input.categoryId && { categoryId: input.categoryId }),
      };

      const products = await ctx.db.product.findMany({
        where,
        include: { Category: true },
        orderBy: { name: "asc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.product.count({ where });

      return {
        products,
        total,
        pageInfo: { limit: input.limit, offset: input.offset },
      };
    }),

  /**
   * Get product by SKU
   */
  getProductBySku: protectedProcedure
    .input(z.object({ sku: z.string() }))
    .query(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      return ctx.db.product.findFirst({
        where: {
          sku: input.sku,
          storeId: storeId,
        },
        include: { Category: true },
      });
    }),

  /**
   * Get product by ID
   */
  getProductById: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      return ctx.db.product.findFirst({
        where: {
          id: input.productId,
          storeId: storeId,
        },
        include: { Category: true, Batch: true },
      });
    }),

  /**
   * Create product
   */
  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        categoryId: z.string(),
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

      // Check SKU uniqueness globally
      const existingSku = await ctx.db.product.findFirst({
        where: { sku: input.sku },
      });

      if (existingSku) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "SKU already exists",
        });
      }

      // Verify category exists
      const category = await ctx.db.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return ctx.db.product.create({
        data: {
          name: input.name,
          sku: input.sku,
          categoryId: input.categoryId,
          storeId: storeId,
        },
        include: { Category: true },
      });
    }),

  /**
   * Update product
   */
  updateProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(1).optional(),
        categoryId: z.string().optional(),
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

      // If updating category, verify it exists
      if (input.categoryId) {
        const category = await ctx.db.category.findUnique({
          where: { id: input.categoryId },
        });

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
      }

      const updateData: Parameters<typeof ctx.db.product.update>[0]["data"] =
        {};

      if (input.name) updateData.name = input.name;
      if (input.categoryId) updateData.categoryId = input.categoryId;

      return ctx.db.product.update({
        where: { id: input.productId },
        data: updateData,
        include: { Category: true },
      });
    }),

  /**
   * Delete product (only if no batches)
   */
  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const product = await ctx.db.product.findFirst({
        where: {
          id: input.productId,
          storeId: storeId,
        },
        include: { Batch: true },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.Batch.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot delete product with existing batches",
        });
      }

      await ctx.db.product.delete({
        where: { id: input.productId },
      });

      return { success: true };
    }),
});
