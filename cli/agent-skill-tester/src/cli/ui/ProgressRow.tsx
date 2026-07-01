import { Box, Text } from "ink";
import type React from "react";
import type { QueryResult, RunDebugInfo } from "../lib/eval.js";

const TRUNCATE_AT = 60;
const DEBUG_TRUNCATE_AT = 80;

function truncate(s: string, at = TRUNCATE_AT): string {
  return s.length > at ? `${s.slice(0, at - 1)}…` : s;
}

function getAnnotation(run: RunDebugInfo): string | undefined {
  if (run.error !== undefined) return `error: ${truncate(run.error, DEBUG_TRUNCATE_AT)}`;
  if (run.stderr !== undefined) return `stderr: ${truncate(run.stderr, DEBUG_TRUNCATE_AT)}`;
  return undefined;
}

function DebugRunRow({ run }: { run: RunDebugInfo }): React.JSX.Element {
  const annotation = getAnnotation(run);
  const color = run.triggered ? ("green" as const) : ("red" as const);
  return (
    <Box paddingLeft={2}>
      <Text dimColor>run {run.runNumber}: </Text>
      <Text color={color}>{run.triggered ? "✓" : "✗"}</Text>
      {annotation !== undefined && <Text dimColor> {annotation}</Text>}
    </Box>
  );
}

function MainRow({ result }: { result: QueryResult }): React.JSX.Element {
  const { query, triggers, totalRuns, passed } = result;
  const triggerRate = triggers / totalRuns;
  const color = passed ? ("green" as const) : ("red" as const);
  const expectTag = query.should_trigger ? "→ trigger" : "→ skip";
  return (
    <Box>
      <Text color={color}>{passed ? "✓" : "✗"}</Text>
      <Text> </Text>
      <Text dimColor>[{query.split}] </Text>
      <Text dimColor>{expectTag} </Text>
      <Text>{truncate(query.query)}</Text>
      <Text dimColor>
        {" "}
        ({triggers}/{totalRuns} = {(triggerRate * 100).toFixed(0)}%)
      </Text>
    </Box>
  );
}

interface ProgressRowProps {
  result: QueryResult;
}

export function ProgressRow({ result }: ProgressRowProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <MainRow result={result} />
      {result.debugRuns !== undefined &&
        result.debugRuns.map((run) => <DebugRunRow key={run.runNumber} run={run} />)}
    </Box>
  );
}
