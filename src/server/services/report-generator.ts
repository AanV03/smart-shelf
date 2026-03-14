/**
 * Report Generator Service
 * 
 * Genera reportes financieros para tiendas y los guarda en Vercel Blob
 * Luego envía el reporte por email a los managers de la tienda
 */

import { db } from "@/server/db";
import { put } from "@vercel/blob";
import { sendReportEmail } from "@/server/email/send-report";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface ReportData {
  storeId: string;
  period: string;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  itemsSold: number;
  avgMargin: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

/**
 * Genera un reporte financiero para una tienda en un período específico
 */
export async function generateFinancialReport(
  storeId: string,
  period: string = format(new Date(), "yyyy-MM")
): Promise<ReportData | null> {
  try {
    console.log("[REPORT_GENERATOR] Generating report for store:", { storeId, period });

    // Parsear el período (ej: "2026-03" para marzo 2026)
    const [year, month] = period.split("-");
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
        product: true,
      },
    });

    if (batches.length === 0) {
      console.log("[REPORT_GENERATOR] No batches found for period");
      return null;
    }

    // Calcular métricas
    let totalCost = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const batch of batches) {
      const batchCost = batch.costPerUnit * batch.quantity;
      totalCost += batchCost;
      totalItems += batch.quantity;

      // Estimar revenue basado en margen típico (asumiendo 40% margen)
      const estimatedRevenue = batchCost * 1.4;
      totalRevenue += estimatedRevenue;

      // Agrupar por producto
      if (!productStats[batch.productId]) {
        productStats[batch.productId] = {
          name: batch.product.name,
          quantity: 0,
          revenue: 0,
        };
      }
      productStats[batch.productId].quantity += batch.quantity;
      productStats[batch.productId].revenue += estimatedRevenue;
    }

    const netProfit = totalRevenue - totalCost;
    const avgMargin = totalItems > 0 ? (netProfit / totalRevenue) * 100 : 0;

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

    console.log("[REPORT_GENERATOR] Report calculated:", reportData);

    return reportData;
  } catch (error) {
    console.error("[REPORT_GENERATOR_ERROR]", error);
    throw error;
  }
}

/**
 * Guarda un reporte en Vercel Blob y crea registro en BD
 */
export async function saveReportToBlob(
  reportData: ReportData,
  userId: string
): Promise<{ blobUrl: string; blobFileName: string }> {
  try {
    // Generar PDF/CSV del reporte
    const fileName = `report_${reportData.storeId}_${reportData.period}.csv`;
    const csvContent = generateCSV(reportData);

    console.log("[REPORT_GENERATOR] Uploading to Blob:", { fileName });

    // Subir a Vercel Blob
    const blob = await put(fileName, csvContent, {
      access: "private",
      contentType: "text/csv;charset=utf-8",
    });

    console.log("[REPORT_GENERATOR] Uploaded successfully:", { url: blob.url });

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
        blobFileName: blob.filename,
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
        blobFileName: blob.filename,
        generatedBy: userId,
      },
    });

    console.log("[REPORT_GENERATOR] Saved to database:", { reportId: report.id });

    return {
      blobUrl: blob.url,
      blobFileName: blob.filename,
    };
  } catch (error) {
    console.error("[REPORT_GENERATOR_BLOB_ERROR]", error);
    throw error;
  }
}

/**
 * Envía el reporte por email a todos los managers de la tienda
 */
export async function sendReportToManagers(reportData: ReportData): Promise<void> {
  try {
    console.log("[REPORT_GENERATOR] Fetching managers for store:", reportData.storeId);

    // Obtener todos los managers de la tienda
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

    if (managers.length === 0) {
      console.warn("[REPORT_GENERATOR] No managers found for store");
      return;
    }

    console.log("[REPORT_GENERATOR] Found managers:", { count: managers.length });

    // Enviar email a cada manager
    for (const manager of managers) {
      if (!manager.user.email) {
        console.warn("[REPORT_GENERATOR] Manager without email:", { managerId: manager.id });
        continue;
      }

      try {
        console.log("[REPORT_GENERATOR] Sending email to:", manager.user.email);

        await sendReportEmail({
          to: manager.user.email,
          recipientName: manager.user.name ?? "Manager",
          reportData,
        });

        // Marcar como enviado
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

        console.log("[REPORT_GENERATOR] Email sent successfully to:", manager.user.email);
      } catch (emailError) {
        console.error("[REPORT_GENERATOR_EMAIL_ERROR]", emailError);
        // Continuar con el siguiente manager
      }
    }
  } catch (error) {
    console.error("[REPORT_GENERATOR_SEND_ERROR]", error);
    throw error;
  }
}

/**
 * Genera contenido CSV del reporte
 */
function generateCSV(reportData: ReportData): string {
  const lines = [
    "REPORTE FINANCIERO - SMART-SHELF",
    `Período: ${reportData.period}`,
    `Generado: ${new Date().toISOString()}`,
    "",
    "RESUMEN FINANCIERO",
    `Total de Ingresos,${reportData.totalRevenue}`,
    `Total de Costos,${reportData.totalCost}`,
    `Ganancia Neta,${reportData.netProfit}`,
    `Margen Promedio %,${reportData.avgMargin}%`,
    `Items Vendidos,${reportData.itemsSold}`,
    "",
    "TOP 5 PRODUCTOS",
    "Producto,Cantidad,Ingresos",
    ...reportData.topProducts.map(
      (p) => `"${p.name}",${p.quantity},${p.revenue}`
    ),
  ];

  return lines.join("\n");
}

/**
 * Procesa reportes diarios para todas las tiendas
 * Debería ejecutarse como un cron job diario
 */
export async function processAllStoreReports(userId: string = "system"): Promise<void> {
  try {
    console.log("[REPORT_GENERATOR_BATCH] Starting daily report generation");

    // Obtener todas las tiendas
    const stores = await db.store.findMany();

    for (const store of stores) {
      try {
        // Generar reporte del mes anterior (o actual si es principios de mes)
        const period = format(subDays(new Date(), 1), "yyyy-MM");

        const reportData = await generateFinancialReport(store.id, period);

        if (!reportData) {
          console.log("[REPORT_GENERATOR_BATCH] No data for store:", store.id);
          continue;
        }

        // Guardar en blob
        await saveReportToBlob(reportData, userId);

        // Enviar por email
        await sendReportToManagers(reportData);

        console.log("[REPORT_GENERATOR_BATCH] Completed report for store:", store.id);
      } catch (storeError) {
        console.error("[REPORT_GENERATOR_BATCH_STORE_ERROR]", { storeId: store.id, error: storeError });
        // Continuar con la siguiente tienda
      }
    }

    console.log("[REPORT_GENERATOR_BATCH] Daily report generation completed");
  } catch (error) {
    console.error("[REPORT_GENERATOR_BATCH_ERROR]", error);
    throw error;
  }
}
