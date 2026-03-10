import * as Sentry from "@sentry/nextjs"

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.info("[SENTRY] DSN not configured. Error tracking disabled.")
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === "development",
  })

  console.info("[SENTRY] Initialized with DSN:", process.env.SENTRY_DSN)
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
) {
  if (!process.env.SENTRY_DSN) {
    console.error("[SENTRY] DSN not configured. Logging error locally:", error)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: Record<string, any>
) {
  if (!process.env.SENTRY_DSN) {
    console.log(`[SENTRY] ${message}`)
    return
  }

  Sentry.captureMessage(message, level)
  if (context) {
    Sentry.captureContext({
      extra: context,
    })
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string) {
  if (!process.env.SENTRY_DSN) return

  Sentry.setUser({
    id: userId,
    email: email,
  })
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (!process.env.SENTRY_DSN) return
  Sentry.setUser(null)
}
