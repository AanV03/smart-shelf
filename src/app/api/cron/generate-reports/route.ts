import { NextRequest, NextResponse } from "next/server";
import { processAllStoreReports } from "@/server/services/report-generator";

/**
 * POST /api/cron/generate-reports
 * 
 * Cron job que se ejecuta diariamente para generar reportes financieros
 * y enviarlos por email a los managers
 * 
 * Requerimientos:
 * - CRON_SECRET debe estar configurado en variables de entorno
 * - El job debe ejecutarse desde un servicio de cron (Vercel Cron, etc)
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[CRON_REPORTS] Cron job triggered");

    // Validar que la solicitud viene de un servicio autorizado
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn("[CRON_REPORTS] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON_REPORTS] Unauthorized request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON_REPORTS] Starting report generation process");

    // Ejecutar generación de reportes
    await processAllStoreReports("cron-system");

    console.log("[CRON_REPORTS] Report generation completed successfully");

    return NextResponse.json(
      {
        message: "Report generation completed successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON_REPORTS_ERROR]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
