import { Box, render, Text, useApp, useInput } from "ink";
import { useState } from "react";

type Step = "select" | "confirm";

interface Props {
  packages: string[];
  action: string;
  onDone: (selected: string[] | null) => void;
}

function toggle(set: Set<string>, name: string): Set<string> {
  const next = new Set(set);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  return next;
}

function PackageSelector({ packages, action, onDone }: Props): React.JSX.Element {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>("select");
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState<string | null>(null);

  const finish = (result: string[] | null) => {
    onDone(result);
    exit();
  };

  // fallow-ignore-next-line complexity
  useInput((input, key) => {
    setHint(null);

    if (step === "confirm") {
      if (input === "y") finish(packages.filter((p) => selected.has(p)));
      else if (input === "n" || key.escape) setStep("select");
      return;
    }

    if (input === "q" || key.escape) return finish(null);
    if (key.upArrow || input === "k")
      return setCursor((c) => (c - 1 + packages.length) % packages.length);
    if (key.downArrow || input === "j") return setCursor((c) => (c + 1) % packages.length);
    if (input === " ") {
      const name = packages[cursor];
      if (name !== undefined) setSelected((s) => toggle(s, name));
      return;
    }
    if (input === "a") {
      setSelected((s) => (s.size === packages.length ? new Set() : new Set(packages)));
      return;
    }
    if (key.return) {
      if (selected.size === 0)
        setHint("Select at least one package (space), or press q to cancel.");
      else setStep("confirm");
    }
  });

  if (step === "confirm") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>
          {action} {selected.size} package(s)?
        </Text>
        {packages
          .filter((p) => selected.has(p))
          .map((p) => (
            <Text key={p}> - {p}</Text>
          ))}
        <Text dimColor>y confirm · n / esc back to selection</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>
        Select packages to {action.toLowerCase()} ({selected.size}/{packages.length} selected)
      </Text>
      {packages.map((name, i) => {
        const active = i === cursor;
        return (
          <Text key={name} {...(active ? { color: "cyan" as const } : {})}>
            {active ? "❯" : " "} {selected.has(name) ? "◉" : "◯"} {name}
          </Text>
        );
      })}
      <Text dimColor>↑/↓ move · space toggle · a toggle all · enter continue · q / esc cancel</Text>
      {hint !== null && <Text color="yellow">{hint}</Text>}
    </Box>
  );
}

/**
 * Interactive multi-select. Resolves with the chosen package names, in the
 * original order, or null when the user cancels.
 */
export async function selectPackages(packages: string[], action: string): Promise<string[] | null> {
  let result: string[] | null = null;
  const { waitUntilExit } = render(
    <PackageSelector
      packages={packages}
      action={action}
      onDone={(r) => {
        result = r;
      }}
    />,
  );
  await waitUntilExit();
  return result;
}
