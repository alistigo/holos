/**
 * Fake @alistigo/artifact-sentry-plugin bundle served in place of the real
 * jsDelivr module by installPluginRoute() (see ../plugin-route.ts).
 *
 * Writes test-observable state to window.__alistigoFakeSentryPlugin instead
 * of DOM elements so the artifact HTML stays clean. Tests read this via
 * frame.evaluate() / frame.waitForFunction().
 */
const PACKAGE_NAME = "@alistigo/artifact-sentry-plugin";

function setup(ctx) {
  const dsn = ctx?.config?.dsn;
  const initialized = Boolean(dsn);
  window.__alistigoFakeSentryPlugin = { initialized, capturedError: false };
  if (!initialized) return;

  ctx.on("error:uncaught", () => {
    window.__alistigoFakeSentryPlugin.capturedError = true;
  });
}

export default { name: PACKAGE_NAME, setup };
