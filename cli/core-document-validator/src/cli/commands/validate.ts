import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import { ValidatorOutput } from "../ui/ValidatorOutput.js";

export class ValidateCommand extends Command {
  static override paths = [Command.Default, ["validate"]];

  static override usage = Command.Usage({
    description: "Validate Alistigo document files against the schema",
    details: `
      Reads each file and validates it against the specified document format.

      list/markdown — AIInputMarkdown fixtures (.md): must have a title line
        ending with ':' or at least one list item.
      list/full-json (default) — full Alistigo list document JSON (.json):
        validated against the list-document JSON schema.

      Exit code 0 if all files are valid, 1 if any file fails.
    `,
    examples: [
      ["Validate markdown fixtures", "bun src/cli.ts --type list/markdown fixtures/groceries.md"],
      ["Validate JSON fixtures", "bun src/cli.ts --type list/full-json fixtures/groceries.json"],
      [
        "Validate multiple markdown files",
        "bun src/cli.ts --type list/markdown fixtures/empty.md fixtures/groceries.md fixtures/duplicates.md",
      ],
    ],
  });

  type = Option.String("--type", {
    required: false,
    description: "Document format type: list/markdown or list/full-json (default: list/full-json)",
  });

  schema = Option.String("--schema", {
    required: false,
    description:
      "Path to a JSON Schema file (list/full-json only). Defaults to the Alistigo list-document schema.",
  });

  files = Option.Rest({ required: 1, name: "files" });

  async execute(): Promise<number> {
    let exitCode = 0;
    const { waitUntilExit } = render(
      React.createElement(ValidatorOutput, {
        files: this.files,
        type: this.type,
        schema: this.schema,
        onComplete: (code: number) => {
          exitCode = code;
        },
      }),
    );
    await waitUntilExit();
    return exitCode;
  }
}
