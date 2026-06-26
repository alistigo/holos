import { createLogger } from "@alistigo/logger";
import posthog from "posthog-js";

const log = createLogger("alistigo:analytics");
let initialized = false;

const EU_HOST = "https://eu.i.posthog.com";

export function initAnalytics(locale: string, version: string): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || initialized) return;

  try {
    posthog.init(key, {
      api_host: EU_HOST,
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
      loaded: () => {
        log.info({ version, locale }, "PostHog initialized");
      },
    });
    initialized = true;
  } catch (err) {
    log.error({ err }, "PostHog init failed");
  }
}

export function trackWidgetDisplayed(props: {
  locale: string;
  storageType: string;
  version: string;
}): void {
  if (!initialized) return;
  posthog.capture("widget_displayed", props);
}

export function isAnalyticsEnabled(): boolean {
  return initialized;
}

export function getAnalyticsHost(): string | undefined {
  return initialized ? EU_HOST : undefined;
}
