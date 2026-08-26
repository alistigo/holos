import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import Ajv from "ajv/dist/2020.js";
import { Box, Text, useApp } from "ink";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export interface ValidateSchemaOutputProps {
  schemaPath: string;
  flatten: boolean;
  output: string | undefined;
  onComplete: (exitCode: number) => void;
}

interface SchemaResult {
  valid: boolean;
  errors: string[];
  flattened?: string;
}

// fallow-ignore-next-line complexity
export function ValidateSchemaOutput({
  schemaPath,
  flatten,
  output,
  onComplete,
}: ValidateSchemaOutputProps): React.JSX.Element {
  const { exit } = useApp();
  const [result, setResult] = useState<SchemaResult | null>(null);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // fallow-ignore-next-line complexity
    const run = async () => {
      let jsonSchema: unknown;
      try {
        jsonSchema = JSON.parse(readFileSync(schemaPath, "utf-8"));
      } catch {
        setResult({ valid: false, errors: ["cannot read or parse schema file as JSON"] });
        setDone(true);
        return;
      }

      // biome-ignore lint/suspicious/noExplicitAny: AJV types
      const ajv = new (Ajv as any)({ allErrors: true, strict: false });
      // schema.org's Thing defines @context as string — conflicts with alistigo's @context object.
      // Register a permissive stub so alistigo schemas compile without enforcing schema.org constraints.
      ajv.addSchema({ $id: "schema:ItemList", type: "object" });
      // Register sibling JSON schemas from the same directory so cross-file $refs resolve.
      const absSchemaPath = resolve(schemaPath);
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
      let valid = true;
      const errors: string[] = [];

      try {
        ajv.compile(jsonSchema);
      } catch (e) {
        valid = false;
        errors.push(e instanceof Error ? e.message : String(e));
      }

      if (!valid) {
        setResult({ valid, errors });
        setDone(true);
        return;
      }

      if (!flatten) {
        setResult({ valid: true, errors: [] });
        setDone(true);
        return;
      }

      try {
        const absPath = resolve(schemaPath);
        const bundled = await $RefParser.bundle(absPath);
        const flatJson = JSON.stringify(bundled, null, 2);

        if (output != null) {
          writeFileSync(output, flatJson, "utf-8");
          setResult({ valid: true, errors: [], flattened: output });
        } else {
          setResult({ valid: true, errors: [], flattened: flatJson });
        }
      } catch (e) {
        setResult({
          valid: false,
          errors: [`flatten failed: ${e instanceof Error ? e.message : String(e)}`],
        });
      }

      setDone(true);
    };
    void run();
  }, [schemaPath, flatten, output]);

  useEffect(() => {
    if (!done || result == null) return;
    onCompleteRef.current(result.valid ? 0 : 1);
    const timer = setTimeout(() => exit(), 50);
    return () => clearTimeout(timer);
  }, [done, result, exit]);

  if (result == null) {
    return (
      <Box>
        <Text>Validating schema…</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={result.valid ? "green" : "red"}>
          {result.valid ? "✓" : "✗"}
          {"  "}
        </Text>
        <Text>{schemaPath}</Text>
      </Box>
      {result.errors.map((e) => (
        <Box key={e} marginLeft={4}>
          <Text color="red">{e}</Text>
        </Box>
      ))}
      {result.flattened != null && output == null && (
        <Box marginTop={1}>
          <Text>{result.flattened}</Text>
        </Box>
      )}
      {result.flattened != null && output != null && (
        <Box marginTop={1}>
          <Text color="cyan">Flattened schema written to {output}</Text>
        </Box>
      )}
    </Box>
  );
}
