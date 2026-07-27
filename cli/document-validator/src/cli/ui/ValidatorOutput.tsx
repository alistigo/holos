import { readFileSync } from "node:fs";
import { validateDocument } from "@alistigo/list-document-format";
import Ajv from "ajv";
import { Box, Text, useApp } from "ink";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface FileResult {
  file: string;
  valid: boolean;
  errors: string[];
}

export interface ValidatorOutputProps {
  files: string[];
  schema?: string | undefined;
  onComplete: (exitCode: number) => void;
}

function FileResultRow({ result }: { result: FileResult }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Box>
        <Text {...(result.valid ? { color: "green" as const } : { color: "red" as const })}>
          {result.valid ? "✓" : "✗"}
          {"  "}
        </Text>
        <Text>{result.file}</Text>
      </Box>
      {!result.valid &&
        result.errors.map((error) => (
          <Box key={error} marginLeft={4}>
            <Text color="red">{error}</Text>
          </Box>
        ))}
    </Box>
  );
}

function SummaryLine({ passed, failed }: { passed: number; failed: number }): React.JSX.Element {
  const text =
    failed === 0
      ? `All ${passed} file${passed === 1 ? "" : "s"} valid`
      : `${passed} passed, ${failed} failed`;
  return (
    <Box marginTop={1}>
      <Text {...(failed === 0 ? { color: "green" as const } : { color: "red" as const })}>
        {text}
      </Text>
    </Box>
  );
}

export function ValidatorOutput({
  files,
  schema,
  onComplete,
}: ValidatorOutputProps): React.JSX.Element {
  const { exit } = useApp();
  const [results, setResults] = useState<FileResult[]>([]);
  const [done, setDone] = useState(false);
  const filesRef = useRef(files);
  const schemaRef = useRef(schema);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // fallow-ignore-next-line complexity
    const run = async () => {
      let customValidator: ((data: unknown) => { valid: boolean; errors: string[] }) | undefined;
      if (schemaRef.current != null) {
        let jsonSchema: unknown;
        try {
          jsonSchema = JSON.parse(readFileSync(schemaRef.current, "utf-8"));
        } catch {
          setResults([
            {
              file: schemaRef.current,
              valid: false,
              errors: ["cannot read or parse schema file as JSON"],
            },
          ]);
          setDone(true);
          return;
        }
        const ajv = new Ajv({ allErrors: true });
        const validate = ajv.compile(jsonSchema as object);
        customValidator = (data: unknown) => {
          const valid = validate(data) as boolean;
          const errors = valid
            ? []
            : (validate.errors ?? []).map((e) =>
                `${e.instancePath} ${e.message ?? "invalid"}`.trim(),
              );
          return { valid, errors };
        };
      }

      for (const file of filesRef.current) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(readFileSync(file, "utf-8"));
        } catch {
          setResults((prev) => [
            ...prev,
            { file, valid: false, errors: ["cannot read or parse as JSON"] },
          ]);
          continue;
        }
        if (customValidator != null) {
          const result = customValidator(parsed);
          setResults((prev) => [...prev, { file, valid: result.valid, errors: result.errors }]);
        } else {
          const result = await validateDocument(parsed);
          setResults((prev) => [...prev, { file, valid: result.valid, errors: result.errors }]);
        }
      }
      setDone(true);
    };
    void run();
  }, []);

  useEffect(() => {
    if (!done) return;
    const allValid = results.every((r) => r.valid);
    onCompleteRef.current(allValid ? 0 : 1);
    const timer = setTimeout(() => exit(), 50);
    return () => clearTimeout(timer);
  }, [done, results, exit]);

  const passed = results.filter((r) => r.valid).length;
  const failed = results.filter((r) => !r.valid).length;

  return (
    <Box flexDirection="column">
      {results.map((r) => (
        <FileResultRow key={r.file} result={r} />
      ))}
      {done && <SummaryLine passed={passed} failed={failed} />}
    </Box>
  );
}
