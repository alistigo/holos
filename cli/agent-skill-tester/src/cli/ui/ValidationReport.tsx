import { Box, Text } from "ink";
import type React from "react";
import type { QueryResult } from "../lib/eval.js";

interface SplitStats {
  passed: number;
  total: number;
}

function splitStats(results: QueryResult[], split: "train" | "validation"): SplitStats {
  const filtered = results.filter((r) => r.query.split === split);
  return {
    passed: filtered.filter((r) => r.passed).length,
    total: filtered.length,
  };
}

function pct(passed: number, total: number): string {
  if (total === 0) return "—";
  return `${((passed / total) * 100).toFixed(1)}%`;
}

interface ValidationReportProps {
  results: QueryResult[];
  threshold: number;
}

export function ValidationReport({ results, threshold }: ValidationReportProps): React.JSX.Element {
  const train = splitStats(results, "train");
  const validation = splitStats(results, "validation");
  const totalPassed = results.filter((r) => r.passed).length;
  const totalAll = results.length;
  const allPass = totalPassed === totalAll;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>{"─".repeat(50)}</Text>
      <Box flexDirection="column" paddingLeft={2}>
        {train.total > 0 && (
          <Box>
            <Text bold>Train: </Text>
            <Text>
              {train.passed}/{train.total} passed{" "}
            </Text>
            <Text dimColor>({pct(train.passed, train.total)})</Text>
          </Box>
        )}
        {validation.total > 0 && (
          <Box>
            <Text bold>Validation: </Text>
            <Text>
              {validation.passed}/{validation.total} passed{" "}
            </Text>
            <Text dimColor>({pct(validation.passed, validation.total)})</Text>
          </Box>
        )}
        <Box>
          <Text bold>Overall: </Text>
          <Text>
            {totalPassed}/{totalAll} passed{" "}
          </Text>
          <Text dimColor>({pct(totalPassed, totalAll)})</Text>
        </Box>
      </Box>
      <Text>{"─".repeat(50)}</Text>
      <Box marginTop={1}>
        <Text {...(allPass ? { color: "green" as const } : { color: "red" as const })} bold>
          {allPass ? "✓ PASS" : "✗ FAIL"}
        </Text>
        <Text dimColor> (threshold: {threshold.toFixed(2)})</Text>
      </Box>
    </Box>
  );
}
