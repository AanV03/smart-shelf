import { NextRequest, NextResponse } from "next/server";
import { processAllStoreReports, validateBlobConfiguration } from "@/server/services/report-generator";
import { captureException, captureMessage } from "@/server/sentry";
import { logger } from "@/server/services/logger";

/**
 * POST /api/cron/generate-reports
 *
 * Cron job que se ejecuta diariamente para generar reportes financieros
 * y enviarlos por email a los managers de cada tienda
 *
 * Security:
 * - Valida CRON_SECRET en el header Authorization
 * - Verifica que Vercel Blob está configurado
 * - Captura todas las excepciones en Sentry con contexto completo
 *
 * Endpoint Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-reports",
 *     "schedule": "0 0 * * *"  // Diariamente a las 00:00 UTC
 *   }]
 * }
 *
 * Environment Variables Required:
 * - CRON_SECRET: Token secreto para validar la solicitud
 * - BLOB_READ_WRITE_TOKEN: Token para leer/escribir en Vercel Blob
 * - RESEND_API_KEY: API Key de Resend para enviar emails
 * - RESEND_FROM_EMAIL: Email de origen (debe ser dominio verificado)
 * - DATABASE_URL: Conexión a Neon PostgreSQL
 * - SENTRY_DSN: (Opcional) Para tracking de errores
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const cronContext = {
    cronJob: "generate-reports",
    timestamp: new Date().toISOString(),
  };

  try {
    console.log("[CRON_REPORTS] Worker triggered", cronContext);
    logger.info("Report generation cron job started", cronContext);

    // ===== VALIDATION: Authorization Header =====
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      const errorMsg =
        "[CRON_REPORTS] CRON_SECRET not configured in environment variables";
      console.error(errorMsg);
      captureException(new Error(errorMsg), {
        ...cronContext,
        stage: "validation_cron_secret_missing",
      });
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "CRON_SECRET not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      const errorMsg =
        "[CRON_REPORTS] Unauthorized: Invalid CRON_SECRET in Authorization header";
      console.warn(errorMsg, { authHeaderProvided: !!authHeader });
      logger.warn("Unauthorized cron request", {
        ...cronContext,
        stage: "validation_auth_failed",
      });
      captureMessage("Unauthorized cron request: generate-reports", "warning");

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("[CRON_REPORTS] Authorization validated successfully");

    // ===== VALIDATION: Blob Configuration =====
    try {
      validateBlobConfiguration();
      console.log("[CRON_REPORTS] Blob configuration validated");
    } catch (configError) {
      console.error("[CRON_REPORTS] Configuration validation failed", configError);
      captureException(configError, {
        ...cronContext,
        stage: "validation_blob_config",
      });
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "Blob storage not properly configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    // ===== EXECUTION: Generate Reports =====
    console.log("[CRON_REPORTS] Starting report generation process");

    const results = await processAllStoreReports("cron-system");

    const duration = Date.now() - startTime;

    console.log("[CRON_REPORTS] Report generation completed", {
      ...cronContext,
      duration: `${duration}ms`,
      results,
    });

    logger.info("Report generation cron job completed successfully", {
      ...cronContext,
      duration,
      ...results,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report generation completed",
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        results: {
          processed: results.processed,
          succeeded: results.succeeded,
          failed: results.failed,
          errors:
            results.errors.length > 0
              ? results.errors
              : "No errors",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error("[CRON_REPORTS_ERROR] Cron job execution failed", {
      ...cronContext,
      duration: `${duration}ms`,
      error,
    });

    logger.error(
      "Report generation cron job failed",
      error,
      {
        ...cronContext,
        duration,
        stage: "execution",
      },
    );

    // Capture exception in Sentry with full context
    captureException(error, {
      ...cronContext,
      duration,
      stage: "cron_execution",
      severity: "error",
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}
