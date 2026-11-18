/**
 * The platform-wide DOM contract every artifact and widget honours so the
 * harness can drive it without domain knowledge.
 *
 * `app` is the readiness marker: the harness waits for it inside the preview
 * iframe to know the artifact is mounted and interactive. Every artifact AND
 * widget rendered in the playground MUST expose it on its mounted root —
 * including `widget`-type packages, which are otherwise exempt from the
 * Artifact Contract. Without it the harness has no way to tell "mounted" from
 * "still loading", and would have to fall back to a probe that races the mount.
 *
 * Domain-specific test ids and roles belong to the features package that needs
 * them, never here.
 */
export const PLATFORM_TEST_IDS = {
  /** Root of a mounted artifact or widget. The readiness signal. */
  app: "alistigo-app",
  /** Optional busy indicator; `data-state` is "pending" or "idle". */
  actionPending: "action-pending",
} as const;

/** Title attribute of the playground's preview iframe. */
export const PREVIEW_IFRAME_TITLE = "Artifact preview";

/** `name` attribute of the playground's preview iframe. */
export const PREVIEW_IFRAME_NAME = "artifact-preview";
