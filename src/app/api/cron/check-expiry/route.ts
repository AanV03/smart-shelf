import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { emailService } from "@/server/services/email"
import { captureException, captureMessage } from "@/server/sentry"
import { logger } from "@/server/services/logger"
import { subDays } from "date-fns"

/**
 * Cron Job: Check for expiring batches and create alerts
 * 
 * Runs every 6 hours (configured in vercel.json)
 * - Finds batches expiring in 3, 5, 7 days
 * - Creates CRITICAL/WARNING/INFO alerts accordingly
 * - Sends email notifications to store managers
 * - Logs to Sentry (if configured)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const cronContext = { cronJob: "check-expiry" }

  try {
    // Verify Vercel Cron Secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("Unauthorized cron request", cronContext)
      captureMessage("Unauthorized cron request: check-expiry", "warning")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    logger.info("Cron job started", cronContext)

    const now = new Date()
    const alerts: { 
      store: string
      severity: string
      count: number
      type: string
    }[] = []
    const emailsSent: { store: string; recipients: number }[] = []

    // Define expiration windows
    const expirationWindows = [
      {
        name: "3 days",
        daysAhead: 3,
        severity: "CRITICAL",
        message: (batchCount: number) =>
          `${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in 3 days or less - FEFO Priority: CRITICAL`,
      },
      {
        name: "5 days",
        daysAhead: 5,
        severity: "WARNING",
        message: (batchCount: number) =>
          `${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in 4-5 days - FEFO Priority: Medium`,
      },
      {
        name: "7 days",
        daysAhead: 7,
        severity: "INFO",
        message: (batchCount: number) =>
          `${batchCount} batch${batchCount > 1 ? "es" : ""} expiring in 6-7 days - Monitor shelf life`,
      },
    ]

    // Get all stores
    const stores = await db.store.findMany()
    logger.info(`Found ${stores.length} stores to check`, cronContext)

    for (const store of stores) {
      const storeContext = { ...cronContext, storeId: store.id }

      // Get store managers for email notifications
      const managers = await db.user.findMany({
        where: {
          storeId: store.id,
          role: "MANAGER",
        },
      })

      const managerEmails = managers
        .map((m) => m.email)
        .filter((email): email is string => !!email)

      logger.debug(`Found ${managerEmails.length} managers for ${store.name}`, storeContext)

      // Track expiration events for this store
      const storeAlerts: {
        severity: string
        count: number
      }[] = []

      for (const window of expirationWindows) {
        const startDate = subDays(now, 1)
        const endDate = subDays(now, 1 - window.daysAhead)

        // Find batches in this window that don't have an alert yet
        const batchesInWindow = await db.batch.findMany({
          where: {
            storeId: store.id,
            status: "ACTIVE",
            expiresAt: {
              gt: startDate,
              lte: endDate,
            },
          },
          include: { product: true },
        })

        if (batchesInWindow.length > 0) {
          // Check if alert already exists for this window
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
          })

          if (!existingAlert) {
            // Create alert for this batch
            await db.alert.create({
              data: {
                type: "EXPIRING_SOON",
                severity: window.severity,
                message: window.message(batchesInWindow.length),
                storeId: store.id,
                batchId: batchesInWindow[0]!.id,
              },
            })

            storeAlerts.push({
              severity: window.severity,
              count: batchesInWindow.length,
            })

            alerts.push({
              store: store.name,
              severity: window.severity,
              count: batchesInWindow.length,
              type: "EXPIRING_SOON",
            })

            logger.info(
              `Created ${window.severity} alert for ${batchesInWindow.length} batches in ${store.name}`,
              { ...storeContext, window: window.name, batchCount: batchesInWindow.length }
            )

            // Send email notification to managers
            if (managerEmails.length > 0) {
              try {
                await emailService.sendExpiringBatchAlert(
                  managerEmails,
                  store.name,
                  batchesInWindow.length,
                  window.daysAhead
                )
                emailsSent.push({
                  store: store.name,
                  recipients: managerEmails.length,
                })
                logger.info(
                  `Sent expiring batch email to ${managerEmails.length} managers`,
                  { ...storeContext, recipients: managerEmails.length }
                )
              } catch (emailError) {
                logger.error(
                  `Failed to send expiring batch email for store ${store.name}`,
                  emailError,
                  storeContext
                )
                captureException(emailError, {
                  store: store.name,
                  type: "expiring_batch_email",
                  ...storeContext,
                })
              }
            }
          }
        }
      }

      // Also check for already-expired batches
      const expiredBatches = await db.batch.findMany({
        where: {
          storeId: store.id,
          status: "ACTIVE",
          expiresAt: {
            lt: now,
          },
        },
      })

      if (expiredBatches.length > 0) {
        // Check if alert already exists
        const existingAlert = await db.alert.findFirst({
          where: {
            storeId: store.id,
            type: "EXPIRED",
            severity: "CRITICAL",
            createdAt: {
              gte: subDays(now, 1),
            },
          },
        })

        if (!existingAlert) {
          await db.alert.create({
            data: {
              type: "EXPIRED",
              severity: "CRITICAL",
              message: `${expiredBatches.length} batch${expiredBatches.length > 1 ? "es" : ""} have expired and must be removed from shelves immediately`,
              storeId: store.id,
              batchId: expiredBatches[0]!.id,
            },
          })

          storeAlerts.push({
            severity: "CRITICAL",
            count: expiredBatches.length,
          })

          alerts.push({
            store: store.name,
            severity: "CRITICAL",
            count: expiredBatches.length,
            type: "EXPIRED",
          })

          logger.warn(
            `${expiredBatches.length} batches have expired in ${store.name}`,
            { ...storeContext, expiredBatchCount: expiredBatches.length }
          )

          // Send critical email notification
          if (managerEmails.length > 0) {
            try {
              await emailService.sendExpiredBatchAlert(
                managerEmails,
                store.name,
                expiredBatches.length
              )
              emailsSent.push({
                store: store.name,
                recipients: managerEmails.length,
              })
              logger.info(
                `Sent expired batch email to ${managerEmails.length} managers`,
                { ...storeContext, recipients: managerEmails.length }
              )
            } catch (emailError) {
              logger.error(
                `Failed to send expired batch email for store ${store.name}`,
                emailError,
                storeContext
              )
              captureException(emailError, {
                store: store.name,
                type: "expired_batch_email",
                ...storeContext,
              })
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime
    logger.info(
      `Cron job completed successfully in ${duration}ms. Created ${alerts.length} alerts, sent ${emailsSent.length} emails.`,
      { ...cronContext, duration, alertCount: alerts.length, emailCount: emailsSent.length }
    )

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      checks: {
        storesChecked: stores.length,
        alertsCreated: alerts.length,
        emailsSent: emailsSent.length,
      },
      details: {
        alerts,
        emails: emailsSent,
      },
      message: `Checked ${stores.length} stores. Created ${alerts.length} alert(s) and sent ${emailsSent.length} email notification(s).`,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(
      `Cron job failed after ${duration}ms`,
      error,
      cronContext
    )

    captureException(error, {
      ...cronContext,
      duration,
      stage: "cron_execution",
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
