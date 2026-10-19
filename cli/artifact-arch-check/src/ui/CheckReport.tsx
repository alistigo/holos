import { Box, Text } from "ink";
import React from "react";
import type { CheckIssue, CheckResult } from "../checks/types.js";

interface CheckReportProps {
  artifactName: string;
  calmFilePath: string;
  results: CheckResult[];
  onComplete: (exitCode: number) => void;
}

export function CheckReport({ artifactName, calmFilePath, results, onComplete }: CheckReportProps) {
  React.useEffect(() => {
    const hasFailed = results.some((r) => !r.passed);
    onComplete(hasFailed ? 1 : 0);
  }, [results, onComplete]);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>artifact-arch-check </Text>
        <Text color="cyan" bold>
          {artifactName}
        </Text>
        <Text dimColor> {calmFilePath}</Text>
      </Box>

      {results.map((result) => (
        <CheckResultSection key={result.checkId} result={result} />
      ))}

      <Box
        borderStyle="single"
        borderColor={failedCount > 0 ? "red" : "green"}
        paddingX={1}
        marginTop={1}
      >
        {failedCount > 0 ? (
          <Text color="red">
            ✗ {failedCount} check{failedCount > 1 ? "s" : ""} failed, {passedCount} passed
          </Text>
        ) : (
          <Text color="green">✓ All {passedCount} checks passed</Text>
        )}
      </Box>
    </Box>
  );
}

function CheckResultSection({ result }: { result: CheckResult }) {
  return (
    <Box flexDirection="column" marginBottom={result.issues.length > 0 ? 1 : 0}>
      <Box>
        {result.passed ? <Text color="green">✓ </Text> : <Text color="red">✗ </Text>}
        <Text bold>{result.checkName}</Text>
        {result.passed && <Text dimColor> — ok</Text>}
      </Box>

      {result.issues.map((issue) => (
        <IssueRow key={`${issue.packageName}:${issue.message}`} issue={issue} />
      ))}
    </Box>
  );
}

function IssueRow({ issue }: { issue: CheckIssue }) {
  return (
    <Box flexDirection="column" marginLeft={2} marginTop={1}>
      <Text color="red"> {issue.packageName}</Text>
      <Text> {issue.message}</Text>
      <Text color="yellow"> Fix : {issue.fix}</Text>
      <Text color="blue"> Docs : {issue.docsRef}</Text>
    </Box>
  );
}
