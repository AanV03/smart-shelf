/**
 * Email Service: Financial Reports
 * 
 * Utiliza Resend para enviar reportes financieros a managers
 */

import { env } from "@/env";

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

interface SendReportEmailInput {
  to: string;
  recipientName: string;
  reportData: ReportData;
}

/**
 * Send financial report email via Resend
 */
export async function sendReportEmail({
  to,
  recipientName,
  reportData,
}: SendReportEmailInput): Promise<void> {
  console.log("[EMAIL_SERVICE_REPORT] Sending report email", {
    to,
    period: reportData.period,
  });

  if (!env.RESEND_API_KEY) {
    console.warn("[EMAIL_SERVICE_REPORT] RESEND_API_KEY not configured, skipping email");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL ?? "noreply@smart-shelf.app",
        to,
        subject: `📊 Tu Reporte Financiero - ${reportData.period}`,
        html: generateReportHTML({
          recipientName,
          reportData,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const { id } = (await response.json()) as { id: string };
    console.log("[EMAIL_SERVICE_REPORT] Report email sent successfully", { id, to });
  } catch (error) {
    console.error("[EMAIL_SERVICE_REPORT] Error sending report email", error);
    throw error; // Propagate error for logging
  }
}

/**
 * Generate report email HTML
 */
function generateReportHTML({
  recipientName,
  reportData,
}: {
  recipientName: string;
  reportData: ReportData;
}): string {
  const profitColor = reportData.netProfit >= 0 ? "#10b981" : "#ef4444";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Reporte Financiero - Smart-Shelf</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 650px;
        margin: 0 auto;
        padding: 20px;
        background: #f5f5f5;
      }
      .card {
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 20px;
      }
      .logo {
        font-size: 28px;
        font-weight: bold;
        color: #1a1a1a;
        margin-bottom: 10px;
      }
      .period {
        color: #666;
        font-size: 16px;
        font-weight: 600;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      }
      .metric {
        padding: 15px;
        background: #f9f9f9;
        border-radius: 6px;
        border-left: 4px solid #1a1a1a;
      }
      .metric.success {
        border-left-color: #10b981;
      }
      .metric.warning {
        border-left-color: #f59e0b;
      }
      .metric-label {
        color: #888;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #1a1a1a;
      }
      .metric-value.positive {
        color: ${profitColor};
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
        margin-top: 30px;
        color: #1a1a1a;
      }
      .products-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      .products-table th {
        background: #f0f0f0;
        padding: 10px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
        font-size: 13px;
        color: #666;
      }
      .products-table td {
        padding: 10px;
        border-bottom: 1px solid #eee;
        font-size: 14px;
      }
      .cta-button {
        display: inline-block;
        background: #1a1a1a;
        color: white;
        padding: 12px 32px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin: 20px 0;
      }
      .cta-button:hover {
        background: #333;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        color: #999;
        font-size: 12px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="logo">📊 Smart-Shelf</div>
          <div class="period">Reporte Financiero - ${reportData.period}</div>
        </div>

        <p>Hola ${recipientName},</p>
        
        <p>Tu reporte financiero del período ${reportData.period} está listo. Aquí está el resumen:</p>

        <div class="summary">
          <div class="metric">
            <div class="metric-label">Ingresos Totales</div>
            <div class="metric-value">$${reportData.totalRevenue.toLocaleString('es-MX')}</div>
          </div>
          
          <div class="metric">
            <div class="metric-label">Costos Totales</div>
            <div class="metric-value">$${reportData.totalCost.toLocaleString('es-MX')}</div>
          </div>
          
          <div class="metric success">
            <div class="metric-label">Ganancia Neta</div>
            <div class="metric-value positive">$${reportData.netProfit.toLocaleString('es-MX')}</div>
          </div>
          
          <div class="metric">
            <div class="metric-label">Margen Promedio</div>
            <div class="metric-value">${reportData.avgMargin}%</div>
          </div>
        </div>

        <p><strong>Items Vendidos:</strong> ${reportData.itemsSold}</p>

        <div class="section-title">🏆 Top 5 Productos</div>
        
        <table class="products-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.topProducts
              .map(
                (product) => `
              <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>$${product.revenue.toLocaleString('es-MX')}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <p style="text-align: center;">
          <a href="http://localhost:3000/dashboard/analytics" class="cta-button">
            Ver Reporte Completo
          </a>
        </p>

        <div class="footer">
          <p>Este reporte fue generado automáticamente por Smart-Shelf.</p>
          <p>© 2026 Smart-Shelf. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
