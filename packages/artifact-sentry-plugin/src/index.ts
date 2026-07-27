import type { AlistigoPlugin, PluginContext } from "@alistigo/artifact-plugin-api";
import { createLogger } from "@alistigo/logger";
import * as Sentry from "@sentry/browser";

const PACKAGE_NAME = "@alistigo/artifact-sentry-plugin";
const log = createLogger("alistigo:artifact-sentry-plugin");

let initialized = false;

function setup(ctx: PluginContext): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialized) return;

  try {
    Sentry.init({
      dsn,
      release: `${ctx.host.packageName}@${ctx.host.version}`,
      environment: ctx.host.environment,
      tracesSampleRate: 0,
    });
    initialized = true;
    log.info({ release: `${ctx.host.packageName}@${ctx.host.version}` }, "Sentry initialized");

    ctx.on("error:uncaught", ({ error }) => {
      Sentry.captureException(error);
    });
  } catch (err) {
    log.error({ err }, "Sentry init failed");
  }
}

const sentryPlugin: AlistigoPlugin = {
  name: PACKAGE_NAME,
  setup,
};

export default sentryPlugin;
