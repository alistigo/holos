import type { AlistigoPlugin, PluginContext } from "@alistigo/artifact-plugin-api";
import { createLogger } from "@alistigo/logger";
import posthog from "posthog-js";

const PACKAGE_NAME = "@alistigo/artifact-posthog-plugin";
const EU_HOST = "https://eu.i.posthog.com";
const log = createLogger("alistigo:artifact-posthog-plugin");

let initialized = false;

function setup(ctx: PluginContext): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || initialized) return;

  try {
    posthog.init(key, {
      api_host: EU_HOST,
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
      loaded: () => {
        log.info({ host: ctx.host.packageName }, "PostHog initialized");
      },
    });
    initialized = true;

    ctx.on("widget:displayed", (payload) => {
      posthog.capture("widget_displayed", payload);
    });
  } catch (err) {
    log.error({ err }, "PostHog init failed");
  }
}

const posthogPlugin: AlistigoPlugin = {
  name: PACKAGE_NAME,
  setup,
};

export default posthogPlugin;
