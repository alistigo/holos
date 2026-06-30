---
name: ts-cli
description: TypeScript CLI conventions using Clipanion + Ink. INVOKE WHEN building a CLI tool, runner, or command-line interface in TypeScript. Use Clipanion for arg parsing and Ink (React) for terminal UI.
---

# TypeScript CLI — Clipanion + Ink

Standard for building CLI tools in this repo.

## Stack

| Library | Role | Version |
|---------|------|---------|
| **Clipanion** | Command parsing, flags, validation | ^4.x |
| **Ink** | React-based terminal UI | ^5.x |
| **React** | Ink peer dependency | ^18.x |

## Dependencies

```sh
pnpm add -F <package> clipanion ink react
pnpm add -D -F <package> @types/react
```

## tsconfig

Add JSX support to the package's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

## File Structure

```
src/
  cli.ts                        # Clipanion entry point (#!/usr/bin/env bun)
  cli/
    commands/
      <command>.ts              # Command classes (plain .ts)
    ui/
      <Component>.tsx           # Ink React components (.tsx)
```

## Clipanion Entry Point

```typescript
// src/cli.ts
import { Cli } from "clipanion";
import { MyCommand } from "./cli/commands/my-command.js";

const cli = new Cli({
  binaryLabel: "my-tool",
  binaryName: "bun src/cli.ts",
  binaryVersion: "0.1.0",
});

cli.register(MyCommand);
cli.runExit(process.argv.slice(2));
```

## Clipanion Command

```typescript
// src/cli/commands/my-command.ts
import { Command, Option } from "clipanion";

export class MyCommand extends Command {
  static override paths = [["run"]];

  static override usage = Command.Usage({
    description: "Run something",
    examples: [["Basic usage", "run foo --flag bar"]],
  });

  // Positional argument
  name = Option.String({ required: true, name: "name" });

  // Named flag with short alias
  target = Option.String("--target,-t", { required: true });

  // Optional boolean flag
  verbose = Option.Boolean("--verbose,-v", false);

  async execute(): Promise<number | void> {
    // Call Ink render function, return exit code if needed
  }
}
```

## Ink Component

```tsx
// src/cli/ui/MyComponent.tsx
import React, { useState, useEffect, useRef } from "react";
import { render, Box, Text, useApp } from "ink";

function MyComponent({ name }: { name: string }): React.JSX.Element {
  const { exit } = useApp();
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Do async work, then:
    setDone(true);
  }, []);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => exit(), 50);
      return () => clearTimeout(timer);
    }
  }, [done]);

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">{name}</Text>
    </Box>
  );
}

export async function renderMyComponent(name: string): Promise<void> {
  const { waitUntilExit } = render(<MyComponent name={name} />);
  await waitUntilExit();
}
```

## Spinner Pattern

```tsx
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function Spinner(): React.JSX.Element {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <Text color="yellow">{FRAMES[frame]}</Text>;
}
```

## Progress Reporting

For long-running operations, use the `StageEvent` pattern from `@mlabrut/agent-core`:

```typescript
interface StageEvent {
  stage: number;
  totalStages: number;
  name: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}
```

The caller passes a `progress` callback. The Ink component subscribes to it and updates stage rows in real time.

## Console Suppression

When Ink owns the terminal, suppress `console.log` from library code to keep the UI clean:

```typescript
useEffect(() => {
  const origLog = console.log;
  const origWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};

  doWork()
    .finally(() => {
      console.log = origLog;
      console.warn = origWarn;
    });
}, []);
```

## `exactOptionalPropertyTypes` Gotchas

This repo has `exactOptionalPropertyTypes: true`. Watch out for:

1. **Ink `color` prop** — cannot pass `undefined`. Use spread instead:
   ```tsx
   // BAD: color can be undefined
   <Text color={isActive ? "yellow" : undefined}>

   // GOOD: conditionally spread the prop
   <Text {...(isActive ? { color: "yellow" as const } : {})}>
   ```

2. **Optional fields** — cannot assign `undefined` to optional properties:
   ```typescript
   // BAD
   const obj: MyType = { detail: event.detail }; // detail might be undefined

   // GOOD
   const obj: MyType = {
     ...(event.detail != null ? { detail: event.detail } : {}),
   };
   ```

## Reference Implementation

Working example: `agents/_core/src/cli/`

- Entry: `agents/_core/src/cli.ts`
- Command: `agents/_core/src/cli/commands/run.ts`
- UI: `agents/_core/src/cli/ui/AgentRunner.tsx`
