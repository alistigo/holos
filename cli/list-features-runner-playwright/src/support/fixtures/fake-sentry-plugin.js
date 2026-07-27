/**
 * Fake @alistigo/artifact-sentry-plugin bundle served in place of the real
 * jsDelivr module by installPluginRoute() (see ../plugin-route.ts).
 *
 * The real plugin reads its DSN from a build-time Vite env var and calls the
 * real @sentry/browser SDK, leaving no observable state a black-box E2E test
 * could assert on. This fixture mirrors the real plugin's public contract
 * (name + setup(ctx)) but reads its DSN from ctx.config (the runtime config
 * an E2E test can control via the ?plugins= URL param) and writes its
 * init/capture decisions to a DOM marker element instead.
 */
const PACKAGE_NAME = "@alistigo/artifact-sentry-plugin";

function marker() {
  let el = document.querySelector('[data-testid="fake-plugin-marker"]');
  if (!el) {
    el = document.createElement("div");
    el.setAttribute("data-testid", "fake-plugin-marker");
    el.style.display = "none";
    document.body.appendChild(el);
  }
  return el;
}

function setup(ctx) {
  const el = marker();
  el.setAttribute("data-plugin-name", PACKAGE_NAME);
  el.setAttribute("data-captured-error", "false");

  const dsn = ctx?.config?.dsn;
  const initialized = Boolean(dsn);
  el.setAttribute("data-initialized", String(initialized));
  if (!initialized) return;

  ctx.on("error:uncaught", ({ error }) => {
    el.setAttribute("data-captured-error", "true");
    el.setAttribute("data-captured-error-message", String(error?.message ?? error));
  });
}

export default { name: PACKAGE_NAME, setup };
