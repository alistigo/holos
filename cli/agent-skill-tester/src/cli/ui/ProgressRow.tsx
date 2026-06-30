import { Box, Text } from "ink";
import type React from "react";
import type { QueryResult } from "../commands/validate-triggers.js";

const TRUNCATE_AT = 60;

function truncate(s: string): string {
  return s.length > TRUNCATE_AT ? `${s.slice(0, TRUNCATE_AT - 1)}…` : s;
}

interface ProgressRowProps {
  result: QueryResult;
}

export function ProgressRow({ result }: ProgressRowProps): React.JSX.Element {
  const { query, triggers, totalRuns, passed } = result;
  const triggerRate = triggers / totalRuns;
  const rateStr = `${triggers}/${totalRuns}`;
  const splitTag = `[${query.split}]`;
  const expectTag = query.should_trigger ? "→ trigger" : "→ skip";

  return (
    <Box>
      <Text {...(passed ? { color: "green" as const } : { color: "red" as const })}>
        {passed ? "✓" : "✗"}
      </Text>
      <Text> </Text>
      <Text dimColor>{splitTag} </Text>
      <Text dimColor>{expectTag} </Text>
      <Text>{truncate(query.query)}</Text>
      <Text dimColor>
        {" "}
        ({rateStr} = {(triggerRate * 100).toFixed(0)}%)
      </Text>
    </Box>
  );
}
