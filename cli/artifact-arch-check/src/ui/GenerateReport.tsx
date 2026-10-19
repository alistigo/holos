import { Box, Text } from "ink";
import React from "react";

interface GenerateReportProps {
  artifactName: string;
  outputPath: string;
  onComplete: (exitCode: number) => void;
}

export function GenerateReport({ artifactName, outputPath, onComplete }: GenerateReportProps) {
  React.useEffect(() => {
    onComplete(0);
  }, [onComplete]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="green">✓ </Text>
        <Text bold>Generated CALM file for </Text>
        <Text color="cyan" bold>
          {artifactName}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>→ </Text>
        <Text>{outputPath}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column" marginLeft={2}>
        <Text bold>Next steps:</Text>
        <Text> 1. Review the generated file and adjust package names if needed</Text>
        <Text> 2. Run checks: artifact-arch-check check {artifactName}</Text>
        <Text> 3. Create packages: bash scripts/new-package.sh {artifactName}-domain</Text>
      </Box>
    </Box>
  );
}

interface GenerateErrorProps {
  artifactName: string;
  error: string;
  onComplete: (exitCode: number) => void;
}

export function GenerateError({ artifactName, error, onComplete }: GenerateErrorProps) {
  React.useEffect(() => {
    onComplete(1);
  }, [onComplete]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="red">✗ Failed to generate CALM file for </Text>
        <Text color="cyan" bold>
          {artifactName}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="red">{error}</Text>
      </Box>
    </Box>
  );
}
