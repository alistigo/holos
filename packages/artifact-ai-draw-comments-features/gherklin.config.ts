export default {
  featureDirectory: "./features",
  rules: {
    "no-empty-file": "error",
    "no-dupe-features": "error",
    "no-dupe-scenarios": "error",
    "no-unnamed-scenarios": "error",
    "scenario-action": "error",
    "scenario-verification": "error",
    indentation: ["error", { Feature: 0, Background: 0, Scenario: 0, Step: 2, Examples: 2 }],
    "no-trailing-spaces": "error",
    "new-line-at-eof": "error",
    "keywords-in-logical-order": "error",
    "unique-examples": "error",
    "allowed-tags": "off",
    "disallowed-tags": "off",
    "no-background-only": "off",
  },
};
