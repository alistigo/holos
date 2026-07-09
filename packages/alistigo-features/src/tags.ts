/**
 * Tag taxonomy for Alistigo feature files.
 *
 * This file is the **source of truth** for every tag the codebase recognizes.
 * The Gherklin lint config references it; the runner uses it to filter
 * scenarios; CI uses it to assemble suite runs.
 *
 * When you introduce a new tag, add it here AND document it in `docs/tags.md`.
 * Untyped or undocumented tags are rejected by the lint pipeline.
 *
 * Tag categories follow the `gherkin-features` skill: Milestone, Group,
 * Capability, Test type, Suite, Actor.
 */

/**
 * Which milestone a feature belongs to. Required — every Feature has exactly one.
 *
 * `@platform` marks cross-cutting platform capabilities (e.g. the artifact plugin
 * system) that are orthogonal to the numbered milestone sequence, rather than
 * belonging to a specific numbered milestone.
 */
export const MILESTONE_TAGS = ["@m1", "@m2", "@m3", "@m4", "@v1", "@platform"] as const;
export type MilestoneTag = (typeof MILESTONE_TAGS)[number];

/**
 * Which feature group a feature belongs to. Required — every Feature has
 * exactly one. Mirrors the folder layout under `features/`.
 *
 * - `@core` — base list app (text elements, add, delete, persist)
 * - `@artifact-plugins` — artifact-lifecycle/infra plugins (Sentry, PostHog)
 * - Domain plugin groups will be added as they land: `@todo`, `@checklist`, etc.
 */
export const GROUP_TAGS = ["@core", "@artifact-plugins"] as const;
export type GroupTag = (typeof GROUP_TAGS)[number];

/** What capability the feature exercises. Required — at least one. */
export const CAPABILITY_TAGS = [
  "@capability:list",
  "@capability:element",
  "@capability:persistence",
  "@capability:loading",
  "@capability:export",
  "@capability:host-protocol",
  "@capability:plugins",
] as const;
export type CapabilityTag = (typeof CAPABILITY_TAGS)[number];

/** What kind of scenario this is. Optional. */
export const TEST_TYPE_TAGS = ["@happy-path", "@edge-case", "@error-path"] as const;
export type TestTypeTag = (typeof TEST_TYPE_TAGS)[number];

/** Which suite the scenario participates in. Optional. */
export const SUITE_TAGS = ["@smoke", "@regression", "@todo"] as const;
export type SuiteTag = (typeof SUITE_TAGS)[number];

/** Who triggers the scenario. Optional. */
export const ACTOR_TAGS = ["@actor:user", "@actor:ai", "@actor:host"] as const;
export type ActorTag = (typeof ACTOR_TAGS)[number];

export type AlistigoTag =
  | MilestoneTag
  | GroupTag
  | CapabilityTag
  | TestTypeTag
  | SuiteTag
  | ActorTag;

export const ALL_TAGS: readonly AlistigoTag[] = [
  ...MILESTONE_TAGS,
  ...GROUP_TAGS,
  ...CAPABILITY_TAGS,
  ...TEST_TYPE_TAGS,
  ...SUITE_TAGS,
  ...ACTOR_TAGS,
];

const TAG_SET = new Set<string>(ALL_TAGS);

/** True if the tag is part of the recognized taxonomy. */
export function isKnownTag(tag: string): tag is AlistigoTag {
  return TAG_SET.has(tag);
}
