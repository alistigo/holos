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
scenario makes a real Sentry or PostHog network call; "the plugin captures an
event" means the plugin's own capture function was invoked with the expected
payload, consistent with the rest of this suite being deterministic and
app-level rather than end-to-end.

This is a `@platform` milestone group — orthogonal to the numbered `@m1`–`@m4`
sequence, since the plugin system is cross-cutting infrastructure rather than a
milestone-scoped list capability.

## Definition of Done

This group is done when every scenario in this folder is green via the runner,
and a plugin's own package (`@alistigo/artifact-sentry-plugin`,
`@alistigo/artifact-posthog-plugin`) implements exactly the hooks these
scenarios describe.

See:
- [`docs/adrs/0016-artifact-plugin-system.md`](../../../../docs/adrs/0016-artifact-plugin-system.md) for the design
- [`docs/glossary.md`](../../docs/glossary.md) for the Plugin entity and Host actor
- [`docs/style-guide.md`](../../docs/style-guide.md) for how to write a scenario
