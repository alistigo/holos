import { Command, Option } from "clipanion";

export class HelpCommand extends Command {
  static override paths = [["help"], ["-h"], ["--help"]];

  static override usage = Command.Usage({
    description: "Show available commands, or detailed help for one command",
    examples: [
      ["List all commands", "npm-housekeeping help"],
      ["Show detailed help for the list command", "npm-housekeeping help list"],
    ],
  });

  command = Option.Rest();

  async execute(): Promise<number> {
    if (this.command.length > 0) {
      return this.cli.run([...this.command, "--help"]);
    }

    this.context.stdout.write(this.cli.usage());
    this.context.stdout.write(
      "Or run `npm-housekeeping help <command>`. With no command, `check` runs by default.\n",
    );
    return 0;
  }
}
