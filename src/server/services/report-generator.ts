/**
 * Report Generator Service
 *
 * Genera reportes financieros para tiendas y los guarda en Vercel Blob
 * Luego envía el reporte por email a los managers de la tienda usando Resend SDK
 *
 * Todos los errores se capturan y registran en Sentry con contexto completo
 */

import { db } from "@/server/db";
import { put } from "@vercel/blob";
import { sendReportEmail, type ReportData } from "@/server/email/send-report";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { captureException, captureMessage } from "@/server/sentry";
import { logger } from "@/server/services/logger";

export interface GeneratedReportData extends ReportData {
  blobUrl?: string;
  blobFileName?: string;
}

/**
 * Valida que Vercel Blob está configurado correctamente
 */
export function validateBlobConfiguration(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const errorMsg =
      "[REPORT_GENERATOR] BLOB_READ_WRITE_TOKEN not configured. Cannot upload reports to Blob storage.";
    console.error(errorMsg);
    captureException(new Error(errorMsg), {
      stage: "blob_validation",
    });
    throw new Error(errorMsg);
  }
  console.log("[REPORT_GENERATOR] Blob configuration validated");
}

/**
 * Genera un reporte financiero para una tienda en un período específico
 *
 * @param storeId - ID de la tienda
 * @param period - Período en formato "yyyy-MM" (ej: "2026-03")
 * @returns ReportData con métricas calculadas, o null si no hay datos
 */
export async function generateFinancialReport(
  storeId: string,
  period: string = format(new Date(), "yyyy-MM"),
): Promise<ReportData | null> {
  const reportContext = {
    stage: "generate_financial_report",
    storeId,
    period,
  };

  try {
    console.log("[REPORT_GENERATOR] Generating report for store", reportContext);

    // Parsear el período (ej: "2026-03" para marzo 2026)
    const [year, month] = period.split("-");
    if (!year || !month) {
      throw new Error(`Invalid period format. Expected "yyyy-MM", got "${period}"`);
    }

    const startDate = startOfMonth(new Date(`${year}-${month}-01`));
    const endDate = endOfMonth(startDate);

    // Obtener todos los batches de la tienda en ese período
    const batches = await db.batch.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Product: true,
      },
    });

    if (batches.length === 0) {
      console.log(
        "[REPORT_GENERATOR] No batches found for period",
        reportContext,
      );
      return null;
    }

    console.log("[REPORT_GENERATOR] Found batches", {
      ...reportContext,
      batchCount: batches.length,
    });

    // Calcular métricas
    let totalCost = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    const productStats: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    for (const batch of batches) {
      const batchCost = batch.costPerUnit * batch.quantity;
      totalCost += batchCost;
      totalItems += batch.quantity;

      // Estimar revenue basado en margen típico (asumiendo 40% margen)
      const estimatedRevenue = batchCost * 1.4;
      totalRevenue += estimatedRevenue;

      // Agrupar por producto
      productStats[batch.productId] ??= {
        name: batch.Product.name,
        quantity: 0,
        revenue: 0,
      };
      const stats = productStats[batch.productId];
      if (stats) {
        stats.quantity += batch.quantity;
        stats.revenue += estimatedRevenue;
      }
    }

    const netProfit = totalRevenue - totalCost;
    const avgMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Top 5 productos por revenue
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const reportData: ReportData = {
      storeId,
      period,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      itemsSold: totalItems,
      avgMargin: Math.round(avgMargin * 100) / 100,
      topProducts,
    };

    console.log("[REPORT_GENERATOR] Report calculated successfully", {
      ...reportContext,
      metrics: {
        totalRevenue: reportData.totalRevenue,
        totalCost: reportData.totalCost,
        netProfit: reportData.netProfit,
        itemsSold: totalItems,
      },
    });

    return reportData;
  } catch (error) {
    console.error("[REPORT_GENERATOR_ERROR] Failed to generate report", {
      ...reportContext,
      error,
    });
    captureException(error, reportContext);
    throw error;
  }
}

/**
 * Guarda un reporte en Vercel Blob y crea registro en BD
 *
 * @param reportData - Datos del reporte calculados
 * @param userId - ID del usuario/sistema que genera el reporte
 * @returns URL del blob y nombre del archivo
 */
export async function saveReportToBlob(
  reportData: ReportData,
  userId: string,
): Promise<{ blobUrl: string; blobFileName: string }> {
  const blobContext = {
    stage: "save_report_to_blob",
    storeId: reportData.storeId,
    period: reportData.period,
  };

  try {
    // Validar Blob configuration
    validateBlobConfiguration();

    // Generar CSV del reporte
    const fileName = `report_${reportData.storeId}_${reportData.period}.csv`;
    const csvContent = generateCSV(reportData);

    console.log("[REPORT_GENERATOR] Uploading to Blob", {
      ...blobContext,
      fileName,
      csvSize: csvContent.length,
    });

    // Subir a Vercel Blob
    const blob = await put(fileName, csvContent, {
      access: "private",
      contentType: "text/csv;charset=utf-8",
    });

    console.log("[REPORT_GENERATOR] Uploaded to Blob successfully", {
      ...blobContext,
      url: blob.url,
    });

    // Guardar en BD
    const report = await db.financialReport.upsert({
      where: {
        storeId_period: {
          storeId: reportData.storeId,
          period: reportData.period,
        },
      },
      update: {
        totalRevenue: reportData.totalRevenue,
        totalCost: reportData.totalCost,
        netProfit: reportData.netProfit,
        blobUrl: blob.url,
        blobFileName: fileName,
        generatedAt: new Date(),
        generatedBy: userId,
      },
      create: {
        storeId: reportData.storeId,
        period: reportData.period,
        totalRevenue: reportData.totalRevenue,
        totalCost: reportData.totalCost,
        netProfit: reportData.netProfit,
        blobUrl: blob.url,
        blobFileName: fileName,
        generatedBy: userId,
      },
    });

    console.log("[REPORT_GENERATOR] Saved to database successfully", {
      ...blobContext,
      reportId: report.id,
    });

    return {
      blobUrl: blob.url,
      blobFileName: fileName,
    };
  } catch (error) {
    console.error("[REPORT_GENERATOR_BLOB_ERROR] Failed to save report", {
      ...blobContext,
      error,
    });
    captureException(error, blobContext);
    throw error;
  }
}

/**
 * Envía el reporte por email a todos los managers de la tienda
 *
 * @param reportData - Datos del reporte
 * @throws Error si no hay managers o si Resend falla
 */
export async function sendReportToManagers(
  reportData: ReportData,
): Promise<void> {
  const emailContext = {
    stage: "send_report_to_managers",
    storeId: reportData.storeId,
    period: reportData.period,
  };

  try {
    console.log(
      "[REPORT_GENERATOR] Fetching managers for store",
      emailContext,
    );

    // Obtener todos los managers de la tienda usando StoreMember (v2.0 multi-tenant)
    const managers = await db.storeMember.findMany({
      where: {
        storeId: reportData.storeId,
        role: "MANAGER",
        status: "ACTIVE",
      },
      include: {
        user: true,
      },
    });

    console.log("[REPORT_GENERATOR] Found managers", {
      ...emailContext,
      managerCount: managers.length,
    });

    if (managers.length === 0) {
      console.warn("[REPORT_GENERATOR] No managers found for store", emailContext);
      return;
    }

    // Enviar email a cada manager
    const emailResults: {
      success: boolean;
      email: string;
      error?: string;
    }[] = [];

    for (const manager of managers) {
      if (!manager.user.email) {
        console.warn("[REPORT_GENERATOR] Manager without email", {
          ...emailContext,
          managerId: manager.id,
          userName: manager.user.name,
        });
        emailResults.push({
          success: false,
          email: "unknown",
          error: "No email configured",
        });
        continue;
      }

      const managerEmailContext = {
        ...emailContext,
        recipientEmail: manager.user.email,
        recipientName: manager.user.name,
      };

      try {
        console.log("[REPORT_GENERATOR] Sending email to manager", managerEmailContext);

        const result = await sendReportEmail({
          to: manager.user.email,
          recipientName: manager.user.name ?? "Manager",
          reportData,
        });

        // Marcar como enviado en BD
        await db.financialReport.update({
          where: {
            storeId_period: {
              storeId: reportData.storeId,
              period: reportData.period,
            },
          },
          data: {
            sentAt: new Date(),
            sentTo: manager.user.email,
          },
        });

        console.log(
          "[REPORT_GENERATOR] Email sent successfully to manager",
          {
            ...managerEmailContext,
            messageId: result.messageId,
          },
        );

        emailResults.push({
          success: true,
          email: manager.user.email,
        });
      } catch (emailError) {
        console.error(
          "[REPORT_GENERATOR_EMAIL_ERROR] Failed to send email to manager",
          {
            ...managerEmailContext,
            error: emailError,
          },
        );

        captureException(emailError, managerEmailContext);
        emailResults.push({
          success: false,
          email: manager.user.email,
          error:
            emailError instanceof Error ? emailError.message : "Unknown error",
        });

        // Continuar con el siguiente manager
      }
    }

    // Resumir resultados
    const successCount = emailResults.filter((r) => r.success).length;
    console.log("[REPORT_GENERATOR] Email sending completed", {
      ...emailContext,
      successCount,
      failureCount: emailResults.length - successCount,
      details: emailResults,
    });
  } catch (error) {
    console.error("[REPORT_GENERATOR_SEND_ERROR] Failed to send reports", {
      ...emailContext,
      error,
    });
    captureException(error, emailContext);
    throw error;
  }
}

/**
 * Genera contenido CSV del reporte con formato mejorado
 */
function generateCSV(reportData: ReportData): string {
  const lines = [
    "REPORTE FINANCIERO - SMART-SHELF",
    `Período: ${reportData.period}`,
    `Generado: ${new Date().toISOString()}`,
    "",
    "RESUMEN FINANCIERO",
    "Métrica,Valor",
    `Total de Ingresos,${reportData.totalRevenue}`,
    `Total de Costos,${reportData.totalCost}`,
    `Ganancia Neta,${reportData.netProfit}`,
    `Margen Promedio %,${reportData.avgMargin}%`,
    `Items Vendidos,${reportData.itemsSold}`,
    "",
    "TOP 5 PRODUCTOS",
    "Producto,Cantidad,Ingresos",
    ...reportData.topProducts.map(
      (p) => `"${p.name}",${p.quantity},${p.revenue}`,
    ),
  ];

  return lines.join("\n");
}

/**
 * Procesa reportes para todas las tiendas
 * Debería ejecutarse como un cron job diario
 *
 * @param userId - ID del sistema que ejecuta el generador
 */
export async function processAllStoreReports(
  userId = "system",
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ storeId: string; error: string }>;
}> {
  const batchContext = {
    stage: "process_all_store_reports",
    userId,
  };

  console.log("[REPORT_GENERATOR_BATCH] Starting daily report generation", batchContext);

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ storeId: string; error: string }>,
  };

  try {
    // Validar Blob al inicio
    validateBlobConfiguration();

    // Obtener todas las tiendas
    const stores = await db.store.findMany({
      where: {
        deletedAt: null, // Excluir tiendas soft-deleted
      },
    });

    console.log("[REPORT_GENERATOR_BATCH] Found stores", {
      ...batchContext,
      storeCount: stores.length,
    });

    for (const store of stores) {
      results.processed++;

      const storeContext = { ...batchContext, storeId: store.id };

      try {
        console.log("[REPORT_GENERATOR_BATCH] Processing store", storeContext);

        // Generar reporte del mes anterior (o actual si es principios de mes)
        const period = format(subDays(new Date(), 1), "yyyy-MM");

        const reportData = await generateFinancialReport(store.id, period);

        if (!reportData) {
          console.warn(
            "[REPORT_GENERATOR_BATCH] No data for store (skipping)",
            storeContext,
          );
          continue;
        }

        // Guardar en blob
        await saveReportToBlob(reportData, userId);

        // Enviar por email
        await sendReportToManagers(reportData);

        console.log("[REPORT_GENERATOR_BATCH] Completed report for store", storeContext);
        results.succeeded++;
      } catch (storeError) {
        console.error(
          "[REPORT_GENERATOR_BATCH_STORE_ERROR] Failed to process store",
          {
            ...storeContext,
            error: storeError,
          },
        );

        captureException(storeError, storeContext);

        results.failed++;
        results.errors.push({
          storeId: store.id,
          error:
            storeError instanceof Error ? storeError.message : "Unknown error",
        });
      }
    }

    console.log("[REPORT_GENERATOR_BATCH] Daily report generation completed", {
      ...batchContext,
      results,
    });

    return results;
  } catch (error) {
    console.error(
      "[REPORT_GENERATOR_BATCH_ERROR] Critical error in batch processing",
      {
        ...batchContext,
        error,
      },
    );

    captureException(error, {
      ...batchContext,
      stage: "batch_initialization",
    });

    throw error;
  }
}
