/**
 * GET /api/reports
 * 
 * Obtiene los reportes financieros de una tienda
 * Requiere autenticación y rol MANAGER o ADMIN
 */

import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse } from "@/app/api/users/utils";

export async function GET(request: NextRequest) {
  try {
    console.log("[REPORTS_API] GET request");

    // ✅ Validar autenticación
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // ✅ Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get("storeId");
    const period = searchParams.get("period");
    const limit = parseInt(searchParams.get("limit") ?? "12");

    if (!storeId) {
      return errorResponse("storeId es requerido", 400);
    }

    // ✅ Validar acceso a la tienda
    const hasAccess = sessionUser.stores?.some(
      (store) => 
        store.id === storeId && 
        (store.role === "MANAGER" || store.role === "ADMIN")
    );

    if (!hasAccess) {
      console.warn("[REPORTS_API] User does not have access to store", {
        userId: sessionUser.id,
        storeId,
      });
      return errorResponse("No tienes acceso a esta tienda", 403);
    }

    // ✅ Obtener reportes
    let query: any = { storeId };
    if (period) {
      query.period = period;
    }

    const reports = await db.financialReport.findMany({
      where: query,
      orderBy: { period: "desc" },
      take: limit,
    });

    if (reports.length === 0) {
      return successResponse(
        {
          reports: [],
          message: "No hay reportes disponibles aún",
        },
        200
      );
    }

    console.log("[REPORTS_API] Reports fetched successfully", {
      storeId,
      count: reports.length,
    });

    return successResponse(
      {
        reports: reports.map((report) => ({
          id: report.id,
          period: report.period,
          totalRevenue: report.totalRevenue,
          totalCost: report.totalCost,
          netProfit: report.netProfit,
          blobUrl: report.blobUrl,
          blobFileName: report.blobFileName,
          generatedAt: report.generatedAt,
          sentAt: report.sentAt,
          sentTo: report.sentTo,
        })),
      },
      200
    );
  } catch (error) {
    console.error("[REPORTS_API_ERROR]", error);

    if (error instanceof Error) {
      console.error("[REPORTS_API_ERROR_MESSAGE]", error.message);
    }

    return errorResponse("Error al obtener reportes", 500);
  }
}
