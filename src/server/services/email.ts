import { Resend } from "resend";

// Verify Resend API key is configured
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn(
    "[RESEND] API key not configured. Email notifications will be disabled.",
  );
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Email template types
 */
export type EmailTemplate = "expiring_soon" | "expired" | "daily_report";

/**
 * Email notification service
 */
export const emailService = {
  /**
   * Send expiring batch alert email to store managers
   */
  async sendExpiringBatchAlert(
    managerEmails: string[],
    storeName: string,
    batchCount: number,
    daysUntilExpiry: number,
  ) {
    if (!resend) {
      console.warn(
        "[EMAIL] Resend not configured. Skipping notification to managers.",
      );
      return null;
    }

    const severity =
      daysUntilExpiry <= 3
        ? "CRITICAL"
        : daysUntilExpiry <= 5
          ? "WARNING"
          : "INFO";

    const subject =
      severity === "CRITICAL"
        ? `🚨 CRITICAL: ${batchCount} batches expiring in ${daysUntilExpiry} days at ${storeName}`
        : severity === "WARNING"
          ? `⚠️ WARNING: ${batchCount} batches expiring in ${daysUntilExpiry} days at ${storeName}`
          : `📋 INFO: ${batchCount} batches expiring in ${daysUntilExpiry} days at ${storeName}`;

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "alerts@smart-shelf.app",
        to: managerEmails,
        subject,
        html: generateExpiringBatchTemplate(
          storeName,
          batchCount,
          daysUntilExpiry,
          severity,
        ),
      });

      return result;
    } catch (error) {
      console.error("[RESEND] Failed to send expiring batch alert:", error);
      throw error;
    }
  },

  /**
   * Send expired batch alert email to store managers
   */
  async sendExpiredBatchAlert(
    managerEmails: string[],
    storeName: string,
    expiredBatchCount: number,
  ) {
    if (!resend) {
      console.warn(
        "[EMAIL] Resend not configured. Skipping expired batch notification.",
      );
      return null;
    }

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "alerts@smart-shelf.app",
        to: managerEmails,
        subject: `🛑 CRITICAL: ${expiredBatchCount} batches have EXPIRED at ${storeName}`,
        html: generateExpiredBatchTemplate(storeName, expiredBatchCount),
      });

      return result;
    } catch (error) {
      console.error("[RESEND] Failed to send expired batch alert:", error);
      throw error;
    }
  },

  /**
   * Send daily inventory report to managers
   */
  async sendDailyReport(
    managerEmails: string[],
    storeName: string,
    stats: {
      totalInventoryValue: number;
      activeProductCount: number;
      expiringCount: number;
      expiredCount: number;
    },
  ) {
    if (!resend) {
      console.warn(
        "[EMAIL] Resend not configured. Skipping daily report notification.",
      );
      return null;
    }

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "alerts@smart-shelf.app",
        to: managerEmails,
        subject: `📊 Daily Inventory Report - ${storeName}`,
        html: generateDailyReportTemplate(storeName, stats),
      });

      return result;
    } catch (error) {
      console.error("[RESEND] Failed to send daily report:", error);
      throw error;
    }
  },
};

/**
 * Email HTML templates
 */
function generateExpiringBatchTemplate(
  storeName: string,
  batchCount: number,
  daysUntilExpiry: number,
  severity: string,
): string {
  const severityColor =
    severity === "CRITICAL"
      ? "#dc2626"
      : severity === "WARNING"
        ? "#ea580c"
        : "#0891b2";

  return `
    <div style="background-color: #f8fafc; padding: 24px; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; border-left: 4px solid ${severityColor}; padding: 24px;">
        <h1 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px;">
          Smart-Shelf Expiration Alert
        </h1>
        
        <p style="margin: 0 0 12px 0; color: #64748b;">
          Store: <strong>${storeName}</strong>
        </p>
        
        <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: bold;">
            ${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? "s" : ""}
          </p>
          <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">
            Severity: <span style="color: ${severityColor}; font-weight: bold;">${severity}</span>
          </p>
        </div>

        <p style="margin: 16px 0; color: #475569;">
          Please review your inventory immediately and follow FEFO (First-Expired, First-Out) protocols. Schedule shelf rotation to move expiring products to the front.
        </p>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Action Required:</strong> Review batches in the Smart-Shelf manager dashboard and update shelf placement accordingly.
          </p>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background-color: ${severityColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View in Dashboard
        </a>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          This is an automated alert from Smart-Shelf. Do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

function generateExpiredBatchTemplate(
  storeName: string,
  expiredBatchCount: number,
): string {
  return `
    <div style="background-color: #f8fafc; padding: 24px; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; border-left: 4px solid #dc2626; padding: 24px;">
        <h1 style="margin: 0 0 16px 0; color: #7f1d1d; font-size: 24px;">
          🛑 CRITICAL: Expired Products Detected
        </h1>
        
        <p style="margin: 0 0 12px 0; color: #64748b;">
          Store: <strong>${storeName}</strong>
        </p>
        
        <div style="background-color: #fee2e2; border-radius: 6px; padding: 16px; margin: 16px 0; border: 1px solid #fca5a5;">
          <p style="margin: 0; color: #7f1d1d; font-size: 18px; font-weight: bold;">
            ${expiredBatchCount} batch${expiredBatchCount > 1 ? "es" : ""} MUST BE REMOVED FROM SHELVES
          </p>
          <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px;">
            These products have expired and pose a compliance risk.
          </p>
        </div>

        <p style="margin: 16px 0; color: #475569;">
          <strong>Immediate action required:</strong> Remove all expired products from shelves and document disposal per regulations. Mark batches as EXPIRED in the dashboard.
        </p>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-weight: bold;">
            ⚠️ COMPLIANCE ALERT: Selling or serving expired products may violate food safety regulations.
          </p>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Expired Batches
        </a>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          This is a critical automated alert from Smart-Shelf. Do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

function generateDailyReportTemplate(
  storeName: string,
  stats: {
    totalInventoryValue: number;
    activeProductCount: number;
    expiringCount: number;
    expiredCount: number;
  },
): string {
  return `
    <div style="background-color: #f8fafc; padding: 24px; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 24px;">
        <h1 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px;">
          📊 Daily Inventory Report
        </h1>
        
        <p style="margin: 0 0 12px 0; color: #64748b;">
          Store: <strong>${storeName}</strong>
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
          <div style="background-color: #f0f9ff; border-radius: 6px; padding: 12px; border-left: 4px solid #0284c7;">
            <p style="margin: 0; color: #0c4a6e; font-size: 12px;">Inventory Value</p>
            <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: bold;">
              $${stats.totalInventoryValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          
          <div style="background-color: #ecfdf5; border-radius: 6px; padding: 12px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46; font-size: 12px;">Active Products</p>
            <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: bold;">
              ${stats.activeProductCount}
            </p>
          </div>
          
          <div style="background-color: #fff7ed; border-radius: 6px; padding: 12px; border-left: 4px solid #f97316;">
            <p style="margin: 0; color: #7c2d12; font-size: 12px;">Expiring Soon (7d)</p>
            <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: bold;">
              ${stats.expiringCount}
            </p>
          </div>
          
          <div style="background-color: #fee2e2; border-radius: 6px; padding: 12px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #7f1d1d; font-size: 12px;">Expired</p>
            <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: bold;">
              ${stats.expiredCount}
            </p>
          </div>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Full Report
        </a>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          This is an automated daily report from Smart-Shelf. Do not reply to this email.
        </p>
      </div>
    </div>
  `;
}
