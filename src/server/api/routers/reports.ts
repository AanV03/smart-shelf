import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const reportsRouter = createTRPCRouter({
  /**
   * Get financial reports for the user's store
   * Used for listing historical reports and download links
   */
  getReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
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
          message: "Only managers can access financial reports",
        });
      }

      const reports = await ctx.db.financialReport.findMany({
        where: { storeId },
        orderBy: { generatedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.financialReport.count({ where: { storeId } });

      return {
        reports,
        total,
        pageInfo: { limit: input.limit, offset: input.offset },
      };
    }),

  /**
   * Get latest report for the store
   */
  getLatestReport: protectedProcedure.query(async ({ ctx }) => {
    const storeId = ctx.session.user.stores?.[0]?.id;

    if (!storeId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not associated with a store",
      });
    }

    const report = await ctx.db.financialReport.findFirst({
      where: { storeId },
      orderBy: { generatedAt: "desc" },
    });

    return report;
  }),

  /**
   * Get report by period
   */
  getReportByPeriod: protectedProcedure
    .input(z.object({ period: z.string() }))
    .query(async ({ ctx, input }) => {
      const storeId = ctx.session.user.stores?.[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not associated with a store",
        });
      }

      const report = await ctx.db.financialReport.findFirst({
        where: { storeId, period: input.period },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Report for period ${input.period} not found`,
        });
      }

      return report;
    }),
});
