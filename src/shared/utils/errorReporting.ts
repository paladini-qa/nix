/**
 * Optional error reporting hook for ErrorBoundary.
 * Set VITE_ERROR_REPORT_URL in .env to POST { message, stack, componentStack } as JSON.
 * For Sentry, install @sentry/react and call Sentry.captureException in onError instead.
 */
export type ErrorReportPayload = {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
};

export function reportErrorToEndpoint(payload: ErrorReportPayload): void {
  const url = (import.meta.env.VITE_ERROR_REPORT_URL as string | undefined)?.trim();
  if (!url || typeof fetch === "undefined") return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
