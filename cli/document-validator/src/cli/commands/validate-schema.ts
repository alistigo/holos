import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import { ValidateSchemaOutput } from "../ui/ValidateSchemaOutput.js";

export class ValidateSchemaCommand extends Command {
  static override paths = [["validate-schema"]];

  static override usage = Command.Usage({
    description: "Validate a JSON Schema file and optionally flatten it",
    details: `
      Reads the JSON Schema file and validates it against its declared meta-schema
      using AJV (draft 2020-12). Reports errors if the schema is invalid.

      With --flatten, all external $ref references are bundled into a single
      self-contained schema file using @apidevtools/json-schema-ref-parser.

      Exit code 0 if valid, 1 if invalid.
    `,
    examples: [
      ["Validate a schema", "bun src/cli.ts validate-schema path/to/schema.json"],
      ["Validate and flatten", "bun src/cli.ts validate-schema --flatten path/to/schema.json"],
      [
        "Flatten and write to file",
        "bun src/cli.ts validate-schema --flatten --output flat.json path/to/schema.json",
      ],
    ],
  });

  flatten = Option.Boolean("--flatten", false, {
    description: "Bundle all $ref references into a single flattened schema",
  });

  output = Option.String("--output", {
    required: false,
    description: "Write flattened schema to this file (stdout if omitted); only with --flatten",
  });

  schema = Option.String({ required: true, name: "schema" });

  async execute(): Promise<number> {
    let exitCode = 0;
    const { waitUntilExit } = render(
      React.createElement(ValidateSchemaOutput, {
        schemaPath: this.schema,
        flatten: this.flatten,
        output: this.output,
        onComplete: (code: number) => {
          exitCode = code;
        },
      }),
    );
    await waitUntilExit();
    return exitCode;
  }
}
