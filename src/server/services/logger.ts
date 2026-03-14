/**
 * Structured logger service for consistent logging across the application
 * Useful for cron jobs, background tasks, and API routes
 */

export interface LogContext {
  userId?: string;
  storeId?: string;
  cronJob?: string;
  module?: string;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("INFO", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("WARN", message, context));
  }

  error(message: string, error: unknown, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullContext = {
      ...context,
      error: errorMessage,
    };
    console.error(this.formatMessage("ERROR", message, fullContext));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("DEBUG", message, context));
    }
  }
}

export const logger = new Logger();
