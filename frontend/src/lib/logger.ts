/**
 * Production-safe logger.
 * - In development: logs to console normally
 * - In production: silently swallows logs (or sends to error tracking service)
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.error(...args);
    // In production, you could send to Sentry/Bugsnag here later
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
};