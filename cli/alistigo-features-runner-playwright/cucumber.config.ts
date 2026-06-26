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
};

export { defaultProfile as default, allProfile as all };
