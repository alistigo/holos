/**
 * Gherklin lint configuration.
 *
 * Rule set chosen to catch real mistakes (empty files, duplicates, missing
 * action/verification, unnamed scenarios) without fighting the writer. See
 * the v1.0.12 catalogue at gherklin/src/rules/README.md.
 *
 * Rules dropped from earlier intent because they don't exist in v1.0.12:
 *   - no-empty-feature, no-empty-scenarios, no-duplicate-tags
 *   - feature-name, scenario-name, no-unnamed-features
 *   - required-tags
 * The custom validator in tools/validate.ts (run via `pnpm validate`) covers
 * the milestone-tag requirement and a few other policy checks instead.
 */
export default {
  featureDirectory: "./features",
  rules: {
    // Structural — catch real bugs
    "no-empty-file": "error",
    "no-dupe-features": "error",
    "no-dupe-scenarios": "error",

    // Vocabulary — every scenario must be named, action-bearing, and verifying
    "no-unnamed-scenarios": "error",
    "scenario-action": "error",
    "scenario-verification": "error",

    // Style — keep features readable and consistent
    indentation: ["error", { Feature: 0, Background: 0, Scenario: 0, Step: 2, Examples: 2 }],
    "no-trailing-spaces": "error",
    "new-line-at-eof": "error",
    "keywords-in-logical-order": "error",
    "unique-examples": "error",

    // Off until we want them on
    "allowed-tags": "off",
    "disallowed-tags": "off",
    "no-background-only": "off",
  },
};
