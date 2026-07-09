import { FEATURES_DIR } from "@alistigo/features";

const defaultProfile = {
  import: ["src/**/*.ts"],
  format: ["@cucumber/pretty-formatter"],
  backtrace: true,
  failFast: true,
};

const allProfile = {
  import: ["src/**/*.ts"],
  format: ["@cucumber/pretty-formatter"],
  paths: [`${FEATURES_DIR}/**/*.feature`],
  backtrace: true,
  // @todo scenarios describe intended behavior with no step definitions yet —
  // exclude them from execution entirely rather than reporting them undefined.
  tags: "not @todo",
};

export { defaultProfile as default, allProfile as all };
