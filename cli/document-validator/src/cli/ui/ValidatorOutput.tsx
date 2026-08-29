import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isValidListMarkdown, validateDocument } from "@alistigo/list-document";
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
  type?: string | undefined;
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

const SCHEMA_ORG_STUBS = [
  { $id: "schema:Thing", type: "object" },
  { $id: "schema:Action", type: "object" },
  { $id: "schema:Person", type: "object" },
  { $id: "schema:SoftwareApplication", type: "object" },
  { $id: "schema:ItemList", type: "object" },
  { $id: "schema:ListItem", type: "object" },
] as const;

export function ValidatorOutput({
  files,
  type,
  schema,
  onComplete,
}: ValidatorOutputProps): React.JSX.Element {
  const { exit } = useApp();
  const [results, setResults] = useState<FileResult[]>([]);
  const [done, setDone] = useState(false);
  const filesRef = useRef(files);
  const typeRef = useRef(type);
  const schemaRef = useRef(schema);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // fallow-ignore-next-line complexity
    const run = async () => {
      if (typeRef.current === "list/markdown") {
        for (const file of filesRef.current) {
          let content: string;
          try {
            content = readFileSync(file, "utf-8");
          } catch {
            setResults((prev) => [...prev, { file, valid: false, errors: ["cannot read file"] }]);
            continue;
          }
          const valid = isValidListMarkdown(content);
          setResults((prev) => [
            ...prev,
            {
              file,
              valid,
              errors: valid
                ? []
                : [
                    "not a valid AIInputMarkdown: must have a title line ending with ':' or at least one list item",
                  ],
            },
          ]);
        }
        setDone(true);
        return;
      }

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
        // biome-ignore lint/suspicious/noExplicitAny: dynamic import avoids pulling in ajv for non-validating consumers
        const Ajv2020 = (await import("ajv/dist/2020.js")).default as any;
        // biome-ignore lint/suspicious/noExplicitAny: same reason
        const addFormats = (await import("ajv-formats")).default as any;
        const ajv = new Ajv2020({ allErrors: true, strict: false });
        addFormats(ajv);
        for (const stub of SCHEMA_ORG_STUBS) ajv.addSchema(stub);
        // Register sibling JSON schemas from the same directory so cross-file $refs resolve.
        const absSchemaPath = resolve(schemaRef.current);
        for (const sibling of readdirSync(dirname(absSchemaPath)).filter((f) =>
          f.endsWith(".json"),
        )) {
          const siblingPath = `${dirname(absSchemaPath)}/${sibling}`;
          if (siblingPath === absSchemaPath) continue;
          try {
            const siblingContent = JSON.parse(readFileSync(siblingPath, "utf-8"));
            if (
              typeof siblingContent === "object" &&
              siblingContent !== null &&
              "$id" in siblingContent
            ) {
              ajv.addSchema(siblingContent);
            }
          } catch {
            // Skip files that can't be parsed or are already registered
          }
        }
        const validate = ajv.compile(jsonSchema as object);
        customValidator = (data: unknown) => {
          const valid = validate(data) as boolean;
          const errors = valid
            ? []
            : (validate.errors ?? []).map((e: { instancePath: string; message?: string }) =>
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
          // Auto-detect schema from the $schema field in the document.
          // If the document declares an unrecognized $schema, fall back to the
          // default list document validator so the CLI remains usable without flags.
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
