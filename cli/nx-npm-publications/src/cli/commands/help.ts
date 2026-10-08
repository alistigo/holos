import { Command, Option } from "clipanion";

const INTRO = `nx-npm-publications manages the npm packages published from an Nx monorepo:
it compares what is on npm with the projects in your workspace, and helps you
deprecate packages you no longer maintain.

Requires an Nx workspace (nx.json). Run it from inside your Nx monorepo; local
packages are read from the Nx project graph.

Typical workflow:
  1. nx-npm-publications doctor    --scope @myorg   check npm login and access rights
  2. nx-npm-publications list      --scope @myorg   compare npm with the workspace
  3. nx-npm-publications check     --scope @myorg   find stale packages (on npm, gone locally)
  4. nx-npm-publications deprecate --scope @myorg   pick and deprecate stale packages

`;

export class HelpCommand extends Command {
  static override paths = [["help"], ["-h"], ["--help"]];

  static override usage = Command.Usage({
    description: "Show what the tool does and its commands, or detailed help for one command",
    examples: [
      ["Overview and list of commands", "nx-npm-publications help"],
      ["Show detailed help for the list command", "nx-npm-publications help list"],
    ],
  });

  command = Option.Rest();

  async execute(): Promise<number> {
    if (this.command.length > 0) {
      return this.cli.run([...this.command, "--help"]);
    }

    this.context.stdout.write(INTRO);
    this.context.stdout.write(this.cli.usage());
    this.context.stdout.write(
      "Or run `nx-npm-publications help <command>`. With no command, `check` runs by default (it still needs --scope).\n",
    );
    return 0;
  }
}
