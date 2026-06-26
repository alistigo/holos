import { createLogger } from "@alistigo/logger";
import * as Sentry from "@sentry/browser";

const log = createLogger("alistigo:monitoring");
let initialized = false;

export function initMonitoring(version: string): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialized) return;

  try {
    Sentry.init({
      dsn,
      release: `alistigo-artifact-list@${version}`,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    });
    initialized = true;
    log.info({ release: `alistigo-artifact-list@${version}` }, "Sentry initialized");
  } catch (err) {
    log.error({ err }, "Sentry init failed");
  }
}

export function isMonitoringEnabled(): boolean {
  return initialized;
}

export function getMonitoringRelease(): string | undefined {
  return initialized ? Sentry.getClient()?.getOptions().release : undefined;
}
