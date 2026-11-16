// Inlined plugin source so it doesn't need to be copied as a non-TS asset.
const FAKE_SENTRY_PLUGIN_SOURCE = `
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
`;

const FIXTURES: Record<string, string> = {
  "@alistigo/artifact-sentry-plugin": FAKE_SENTRY_PLUGIN_SOURCE,
};

/** Source of the fake plugin bundle registered for `packageName`. */
export function fakePluginSource(packageName: string): string {
  const source = FIXTURES[packageName];
  if (source === undefined) {
    throw new Error(`No fake plugin fixture registered for "${packageName}"`);
  }
  return source;
}
