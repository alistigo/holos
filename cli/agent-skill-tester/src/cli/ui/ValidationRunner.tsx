import { Box, Text, useApp } from "ink";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkTriggered,
  type EvalQuery,
  type QueryResult,
  type RunDebugInfo,
} from "../lib/eval.js";
import { ProgressRow } from "./ProgressRow.js";
import { ValidationReport } from "./ValidationReport.js";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function Spinner(): React.JSX.Element {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(timer);
  }, []);
  const frameChar = SPINNER_FRAMES[frame] ?? "⠋";
  return <Text color="yellow">{frameChar}</Text>;
}

interface RunningState {
  queryIdx: number;
  run: number;
}

interface ValidationRunnerProps {
  queries: EvalQuery[];
  skillName: string;
  agent: string;
  runs: number;
  threshold: number;
  debug?: boolean;
  onComplete: (exitCode: number) => void;
}

// fallow-ignore-next-line complexity
export function ValidationRunner({
  queries,
  skillName,
  agent,
  runs,
  threshold,
  debug,
  onComplete,
}: ValidationRunnerProps): React.JSX.Element {
  const { exit } = useApp();
  const [results, setResults] = useState<QueryResult[]>([]);
  const [running, setRunning] = useState<RunningState | null>({ queryIdx: 0, run: 1 });
  const [done, setDone] = useState(false);
  const [streamEvents, setStreamEvents] = useState<Array<{ count: number; summary: string }>>([]);
  const cancelledRef = useRef(false);

  const appendResult = useCallback((result: QueryResult) => {
    setResults((prev) => [...prev, result]);
  }, []);

  const onStreamEvent = useCallback((count: number, summary: string) => {
    setStreamEvents((prev) => [...prev, { count, summary }]);
  }, []);

  useEffect(() => {
    // fallow-ignore-next-line complexity
    async function runAll(): Promise<void> {
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        if (!query) continue;

        let triggers = 0;
        const debugRuns: RunDebugInfo[] = [];
        for (let r = 1; r <= runs; r++) {
          if (cancelledRef.current) return;
          setRunning({ queryIdx: i, run: r });
          setStreamEvents([]);
          const info = await checkTriggered(query.query, skillName, agent, debug ? onStreamEvent : undefined);
          if (info.triggered) triggers++;
          if (debug) debugRuns.push({ ...info, runNumber: r });
        }

        const triggerRate = triggers / runs;
        const passed = query.should_trigger ? triggerRate >= threshold : triggerRate < threshold;

        appendResult({
          query,
          triggers,
          totalRuns: runs,
          passed,
          ...(debug && debugRuns.length > 0 ? { debugRuns } : {}),
        });
      }

      if (!cancelledRef.current) {
        setRunning(null);
        setDone(true);
      }
    }

    runAll().catch((err: unknown) => {
      process.stderr.write(`Unexpected error: ${String(err)}\n`);
      setDone(true);
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [queries, skillName, agent, runs, threshold, debug, appendResult, onStreamEvent]);

  useEffect(() => {
    if (!done) return;

    const allPass = results.every((r) => r.passed);
    onComplete(allPass ? 0 : 1);

    const timer = setTimeout(() => exit(), 100);
    return () => clearTimeout(timer);
  }, [done, results, onComplete, exit]);

  const currentQuery = running !== null ? queries[running.queryIdx] : undefined;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Skill: </Text>
        <Text color="cyan">{skillName}</Text>
        <Text dimColor>
          {" "}
          ({queries.length} queries × {runs} runs)
        </Text>
      </Box>

      {results.map((result) => (
        <ProgressRow key={result.query.query} result={result} />
      ))}

      {running !== null && currentQuery !== undefined && (
        <Box flexDirection="column">
          <Box>
            <Spinner />
            <Text> </Text>
            <Text dimColor>
              query {running.queryIdx + 1}/{queries.length}, run {running.run}/{runs} —{" "}
              {currentQuery.query.slice(0, 55)}
              {currentQuery.query.length > 55 ? "…" : ""}
            </Text>
          </Box>
          {debug && streamEvents.length > 0 && (
            <Box flexDirection="column" marginLeft={2}>
              {streamEvents.map((ev) => (
                <Text key={ev.count} dimColor>
                  <Text color="gray">[{ev.count}]</Text> {ev.summary}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}

      {done && <ValidationReport results={results} threshold={threshold} />}
    </Box>
  );
}
