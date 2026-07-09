# artifact-plugins — Artifact-lifecycle/infra plugins

Feature group for the composable artifact plugin system (see
[ADR 0016](../../../../docs/adrs/0016-artifact-plugin-system.md)). Covers
plugins that hook into an artifact's lifecycle and event bus — Sentry error
monitoring, PostHog analytics — as distinct from future domain-contribution
plugins (checkbox, priority, etc.) which will get their own group folder(s)
when they land.

| File | Capability |
|------|------------|
| [sentry-error-capture.feature](sentry-error-capture.feature) | Sentry plugin initialization and error reporting |
| [posthog-analytics-tracking.feature](posthog-analytics-tracking.feature) | PostHog plugin initialization and widget-displayed tracking |

## Scope

These scenarios describe plugin lifecycle mechanics — hook invocation and event
reaction — at the Host/Plugin contract level, not real network behavior. No
scenario should make a real Sentry or PostHog network call; "the plugin captures an
event" means the plugin's own capture function was invoked with the expected
payload.

This is a `@platform` milestone group — orthogonal to the numbered `@m1`–`@m4`
sequence, since the plugin system is cross-cutting infrastructure rather than a
milestone-scoped list capability.

## Status: `@todo`

Both features are tagged `@todo` — the runner (`cli/alistigo-features-runner-playwright`)
skips them rather than failing on undefined steps. Unlike the `core/` group, this
runner is a real Playwright harness driving the built iframe against a live preview
server, not an in-memory Application-layer runner. Implementing these scenarios for
real requires:

- Intercepting (via `page.route()`) the jsDelivr URL a plugin resolves to, so the
  dynamic `import()` in `@alistigo/artifact-plugin-api`'s loader serves a local fake
  plugin bundle instead of a real network request — keeping the scenario
  network-free while still exercising the real load → `setup()` → event-subscription
  path end-to-end.
- An observable proxy for internal plugin/event state from the page — the exposed
  `Alistigo.about()` debug API (`plugins: string[]`) covers "is a plugin loaded";
  asserting an emitted event was actually captured needs either a page-side test hook
  or a fake plugin bundle that writes an observable marker (e.g. a DOM attribute) when
  its capture function runs.

Remove `@todo` once that harness support exists and the steps are implemented.

## Definition of Done

This group is done when every scenario in this folder is green via the runner,
and a plugin's own package (`@alistigo/artifact-sentry-plugin`,
`@alistigo/artifact-posthog-plugin`) implements exactly the hooks these
scenarios describe.

See:
- [`docs/adrs/0016-artifact-plugin-system.md`](../../../../docs/adrs/0016-artifact-plugin-system.md) for the design
- [`docs/glossary.md`](../../docs/glossary.md) for the Plugin entity and Host actor
- [`docs/style-guide.md`](../../docs/style-guide.md) for how to write a scenario
