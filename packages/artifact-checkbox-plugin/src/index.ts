import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import { createElement } from "react";
import pkg from "../package.json" with { type: "json" };
import { CheckboxLeading } from "./components/CheckboxLeading.js";
import { checkboxReducer } from "./reducer.js";

export { createCheckListElementEvent } from "./command.js";
export { checkboxReducer };

const checkboxPlugin: AlistigoPlugin = {
  name: "@alistigo/artifact-checkbox-plugin",
  version: pkg.version,
  type: "list-element",
  metadataKey: "checkbox",
  metadataSchema: {
    type: "object",
    properties: { selected: { type: "boolean" } },
  },
  reduce: checkboxReducer,
  renderListElementLeading: (elementId, metadata, onCommand) =>
    createElement(CheckboxLeading, { elementId, metadata, onCommand }),
};

export default checkboxPlugin;
