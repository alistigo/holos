import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import { ValidatorOutput } from "../ui/ValidatorOutput.js";

export class ValidateCommand extends Command {
  // fallow-ignore-next-line unused-class-member
  static override paths = [Command.Default];

  // fallow-ignore-next-line unused-class-member
  static override usage = Command.Usage({
    description: "Validate Alistigo document JSON files against the schema",
    details: `
      Reads each JSON file, parses it, and validates it against the Alistigo
      document schema. Prints a line per file showing OK or FAIL with errors.

      Exit code 0 if all files are valid, 1 if any file fails.
    `,
    examples: [
      ["Validate a single fixture", "bun src/cli.ts fixtures/groceries.json"],
      [
        "Validate multiple files",
        "bun src/cli.ts fixtures/empty.json fixtures/groceries.json fixtures/duplicates.json",
      ],
    ],
  });

  files = Option.Rest({ required: 1, name: "files" });

  // fallow-ignore-next-line unused-class-member complexity
  async execute(): Promise<number> {
    let exitCode = 0;
    const { waitUntilExit } = render(
      React.createElement(ValidatorOutput, {
        files: this.files,
        onComplete: (code: number) => {
          exitCode = code;
        },
      }),
    );
    await waitUntilExit();
    return exitCode;
  }
}
