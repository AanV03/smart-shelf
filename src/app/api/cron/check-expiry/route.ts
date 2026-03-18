import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { emailService } from "@/server/services/email";
import { captureException, captureMessage } from "@/server/sentry";
import { logger } from "@/server/services/logger";
import { subDays } from "date-fns";

/**
 * POST /api/cron/check-expiry
 *
 * Cron Job: Check for expiring batches and create alerts
 *
 * Runs every 6 hours (configured in vercel.json)
 * - Finds batches expiring in 3, 5, 7 days
 * - Creates CRITICAL/WARNING/INFO alerts accordingly
 * - Sends email notifications to store managers and admins
 * - Captures all errors in Sentry with context
 *
 * Security:
 * - Validates CRON_SECRET in Authorization header
 * - Uses StoreMember for v2.0 multi-tenant structure
 * - Only notifies ACTIVE managers and admins
 *
 * Endpoint Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expiry",
 *     "schedule": "0 (every 6 hours) * * *"
 *   }]
 * }
 *
 * Environment Variables Required:
 * - CRON_SECRET: Token secreto para validar la solicitud
 * - RESEND_API_KEY: API Key de Resend para enviar emails
 * - RESEND_FROM_EMAIL: Email de origen
 * - DATABASE_URL: Conexión a Neon PostgreSQL
 * - SENTRY_DSN: (Opcional) Para tracking de errores
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const cronContext = {
    cronJob: "check-expiry",
    timestamp: new Date().toISOString(),
  };

  try {
    console.log("[CHECK_EXPIRY] Cron job triggered", cronContext);
    logger.info("Check expiry cron job started", cronContext);

    // ===== VALIDATION: Authorization Header =====
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      const errorMsg =
        "[CHECK_EXPIRY] CRON_SECRET not configured in environment variables";
      console.error(errorMsg);
      logger.error("CRON_SECRET not configured", new Error(errorMsg), cronContext);

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
        "[CHECK_EXPIRY] Unauthorized: Invalid CRON_SECRET in Authorization header";
      console.warn(errorMsg);
      logger.warn("Unauthorized cron request", {
        ...cronContext,
        stage: "validation_auth_failed",
        authHeaderProvided: !!authHeader,
      });

      captureMessage("Unauthorized cron request: check-expiry", "warning");

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("[CHECK_EXPIRY] Authorization validated successfully");

    // ===== EXECUTION: Check Expiring Batches =====
    const now = new Date();
    const alerts: {
      store: string;
      severity: string;
      count: number;
      type: string;
    }[] = [];
    const emailsSent: { store: string; recipients: number }[] = [];

    // Define expiration windows
    const expirationWindows = [
      {
        name: "3 days",
        daysAhead: 3,
        severity: "CRITICAL",
        message: (batchCount: number) =>
          `⚠️ CRITICAL: ${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in 3 days or less - FEFO Priority: IMMEDIATE ACTION REQUIRED`,
      },
      {
        name: "5 days",
        daysAhead: 5,
        severity: "WARNING",
        message: (batchCount: number) =>
          `⚠️ WARNING: ${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in 4-5 days - FEFO Priority: Plan shelf rearrangement`,
      },
      {
        name: "7 days",
        daysAhead: 7,
        severity: "INFO",
        message: (batchCount: number) =>
          `ℹ️ INFO: ${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in 6-7 days - Monitor shelf life`,
      },
    ];

    // Get all stores (excluding soft-deleted ones)
    const stores = await db.store.findMany({
      where: {
        deletedAt: null,
      },
    });

    console.log("[CHECK_EXPIRY] Found stores to check", {
      ...cronContext,
      storeCount: stores.length,
    });

    for (const store of stores) {
      const storeContext = {
        ...cronContext,
        storeId: store.id,
        storeName: store.name,
      };

      try {
        console.log("[CHECK_EXPIRY] Processing store", storeContext);

        // Get store managers and admins for email notifications (v2.0 multi-tenant)
        const recipients = await db.storeMember.findMany({
          where: {
            storeId: store.id,
            role: { in: ["MANAGER", "ADMIN"] },
            status: "ACTIVE",
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        const recipientEmails = recipients
          .filter((m) => m.user.email)
          .map((m) => ({
            email: m.user.email!,
            name: m.user.name ?? "Manager",
          }));

        console.log("[CHECK_EXPIRY] Found recipients for store", {
          ...storeContext,
          recipientCount: recipientEmails.length,
        });

        // Check each expiration window
        for (const window of expirationWindows) {
          try {
            const startDate = subDays(now, 1);
            const endDate = subDays(now, 1 - window.daysAhead);

            // Find batches in this window
            const batchesInWindow = await db.batch.findMany({
              where: {
                storeId: store.id,
                status: "ACTIVE",
                expiresAt: {
                  gt: startDate,
                  lte: endDate,
                },
              },
              include: { Product: true },
            });

            if (batchesInWindow.length > 0) {
              // Check if alert already exists
              const existingAlert = await db.alert.findFirst({
                where: {
                  storeId: store.id,
                  type: "EXPIRING_SOON",
                  severity: window.severity,
                  message: {
                    contains: window.name,
                  },
                  createdAt: {
                    gte: subDays(now, 1),
                  },
                },
              });

              if (!existingAlert) {
                // Create alert
                await db.alert.create({
                  data: {
                    type: "EXPIRING_SOON",
                    severity: window.severity,
                    message: window.message(batchesInWindow.length),
                    storeId: store.id,
                    batchId: batchesInWindow[0]!.id,
                  },
                });

                alerts.push({
                  store: store.name,
                  severity: window.severity,
                  count: batchesInWindow.length,
                  type: "EXPIRING_SOON",
                });

                console.log(
                  `[CHECK_EXPIRY] Created ${window.severity} alert`,
                  {
                    ...storeContext,
                    window: window.name,
                    batchCount: batchesInWindow.length,
                  },
                );

                // Send email notification
                if (recipientEmails.length > 0) {
                  try {
                    await emailService.sendExpiringBatchAlert(
                      recipientEmails.map((r) => r.email),
                      store.name,
                      batchesInWindow.length,
                      window.daysAhead,
                    );

                    emailsSent.push({
                      store: store.name,
                      recipients: recipientEmails.length,
                    });

                    logger.info("Sent expiring batch alert email", {
                      ...storeContext,
                      recipients: recipientEmails.length,
                      window: window.name,
                      severity: window.severity,
                    });
                  } catch (emailError) {
                    console.error(
                      "[CHECK_EXPIRY_EMAIL_ERROR] Failed to send expiring batch email",
                      {
                        ...storeContext,
                        error: emailError,
                        window: window.name,
                      },
                    );

                    logger.error(
                      "Failed to send expiring batch email",
                      emailError,
                      {
                        ...storeContext,
                        window: window.name,
                        stage: "send_expiring_alert_email",
                      },
                    );

                    captureException(emailError, {
                      ...storeContext,
                      type: "expiring_batch_email",
                      window: window.name,
                    });
                  }
                }
              }
            }
          } catch (windowError) {
            console.error(
              "[CHECK_EXPIRY_WINDOW_ERROR] Error processing expiration window",
              {
                ...storeContext,
                window: window.name,
                error: windowError,
              },
            );

            captureException(windowError, {
              ...storeContext,
              stage: "check_expiration_window",
              window: window.name,
            });
          }
        }

        // Check for already-expired batches
        try {
          const expiredBatches = await db.batch.findMany({
            where: {
              storeId: store.id,
              status: "ACTIVE",
              expiresAt: {
                lt: now,
              },
            },
          });

          if (expiredBatches.length > 0) {
            const existingAlert = await db.alert.findFirst({
              where: {
                storeId: store.id,
                type: "EXPIRED",
                severity: "CRITICAL",
                createdAt: {
                  gte: subDays(now, 1),
                },
              },
            });

            if (!existingAlert) {
              await db.alert.create({
                data: {
                  type: "EXPIRED",
                  severity: "CRITICAL",
                  message: `🚨 CRITICAL: ${expiredBatches.length} batch${expiredBatches.length > 1 ? "es" : ""} have EXPIRED and must be removed from shelves IMMEDIATELY`,
                  storeId: store.id,
                  batchId: expiredBatches[0]!.id,
                },
              });

              alerts.push({
                store: store.name,
                severity: "CRITICAL",
                count: expiredBatches.length,
                type: "EXPIRED",
              });

              console.warn(
                "[CHECK_EXPIRY] Created CRITICAL EXPIRED alert",
                {
                  ...storeContext,
                  expiredBatchCount: expiredBatches.length,
                },
              );

              logger.warn("Expired batches detected", {
                ...storeContext,
                expiredBatchCount: expiredBatches.length,
              });

              // Send critical email notification
              if (recipientEmails.length > 0) {
                try {
                  await emailService.sendExpiredBatchAlert(
                    recipientEmails.map((r) => r.email),
                    store.name,
                    expiredBatches.length,
                  );

                  emailsSent.push({
                    store: store.name,
                    recipients: recipientEmails.length,
                  });

                  logger.info("Sent expired batch alert email", {
                    ...storeContext,
                    recipients: recipientEmails.length,
                    severity: "CRITICAL",
                  });
                } catch (emailError) {
                  console.error(
                    "[CHECK_EXPIRY_EMAIL_ERROR] Failed to send expired batch email",
                    {
                      ...storeContext,
                      error: emailError,
                    },
                  );

                  logger.error(
                    "Failed to send expired batch email",
                    emailError,
                    {
                      ...storeContext,
                      stage: "send_expired_alert_email",
                    },
                  );

                  captureException(emailError, {
                    ...storeContext,
                    type: "expired_batch_email",
                  });
                }
              }
            }
          }
        } catch (expiredError) {
          console.error(
            "[CHECK_EXPIRY_EXPIRED_ERROR] Error checking expired batches",
            {
              ...storeContext,
              error: expiredError,
            },
          );

          captureException(expiredError, {
            ...storeContext,
            stage: "check_expired_batches",
          });
        }
      } catch (storeError) {
        console.error("[CHECK_EXPIRY_STORE_ERROR] Error processing store", {
          ...storeContext,
          error: storeError,
        });

        logger.error("Error processing store", storeError, storeContext);
        captureException(storeError, storeContext);
      }
    }

    const duration = Date.now() - startTime;

    console.log("[CHECK_EXPIRY] Cron job completed successfully", {
      ...cronContext,
      duration: `${duration}ms`,
      alertsCreated: alerts.length,
      emailsSent: emailsSent.length,
    });

    logger.info("Check expiry cron job completed successfully", {
      ...cronContext,
      duration,
      alertsCreated: alerts.length,
      emailsSent: emailsSent.length,
    });

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        checks: {
          storesChecked: stores.length,
          alertsCreated: alerts.length,
          emailsSent: emailsSent.length,
        },
        details: {
          alerts:
            alerts.length > 0
              ? alerts
              : "No alerts created",
          emails:
            emailsSent.length > 0
              ? emailsSent
              : "No emails sent",
        },
        message: `Checked ${stores.length} stores. Created ${alerts.length} alert(s) and sent ${emailsSent.length} email notification(s).`,
      },
      { status: 200 },
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error("[CHECK_EXPIRY_ERROR] Cron job failed", {
      ...cronContext,
      duration: `${duration}ms`,
      error,
    });

    logger.error("Check expiry cron job failed", error, {
      ...cronContext,
      duration,
      stage: "cron_execution",
    });

    captureException(error, {
      ...cronContext,
      duration,
      stage: "cron_execution",
      severity: "error",
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}
