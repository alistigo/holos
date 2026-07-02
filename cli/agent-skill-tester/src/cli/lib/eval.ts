import { spawn } from "node:child_process";
import evalQueriesSchemaJson from "../../schemas/eval-queries.schema.json" with { type: "json" };

export const evalQueriesSchema = evalQueriesSchemaJson;

export interface EvalQuery {
  query: string;
  should_trigger: boolean;
  split: "train" | "validation";
}

function assertQueryField(raw: Record<string, unknown>, prefix: string): string {
  const { query } = raw;
  if (typeof query !== "string" || query.length === 0) {
    throw new Error(`${prefix}.query: expected a non-empty string`);
  }
  return query;
}

function assertShouldTriggerField(raw: Record<string, unknown>, prefix: string): boolean {
  const { should_trigger } = raw;
  if (typeof should_trigger !== "boolean") {
    throw new Error(`${prefix}.should_trigger: expected a boolean`);
  }
  return should_trigger;
}

function assertSplitField(raw: Record<string, unknown>, prefix: string): "train" | "validation" {
  const { split } = raw;
  if (split !== "train" && split !== "validation") {
    throw new Error(`${prefix}.split: expected "train" or "validation"`);
  }
  return split;
}

function validateEvalQuery(item: unknown, index: number, sourcePath: string): EvalQuery {
  const prefix = `${sourcePath}[${index}]`;
  if (typeof item !== "object" || item === null) {
    throw new Error(`${prefix}: expected an object`);
  }
  const raw = item as Record<string, unknown>;
  return {
    query: assertQueryField(raw, prefix),
    should_trigger: assertShouldTriggerField(raw, prefix),
    split: assertSplitField(raw, prefix),
  };
}

export function parseEvalQueries(raw: unknown, sourcePath: string): EvalQuery[] {
  if (!Array.isArray(raw)) {
    throw new Error(`${sourcePath}: expected a JSON array of queries`);
  }
  return raw.map((item, index) => validateEvalQuery(item, index, sourcePath));
}

export interface RunDebugInfo {
  runNumber: number;
  triggered: boolean;
  stderr?: string;
  error?: string;
}

export interface QueryResult {
  query: EvalQuery;
  triggers: number;
  totalRuns: number;
  passed: boolean;
  debugRuns?: RunDebugInfo[];
}

type ContentBlock = {
  type?: string;
  name?: string;
  input?: Record<string, unknown>;
  text?: string;
};

type StreamEvent = {
  type?: string;
  subtype?: string;
  message?: {
    content?: ContentBlock[];
  };
};

function isSkillUse(event: StreamEvent, skillName: string): boolean {
  return (event.message?.content ?? []).some(
    (block) =>
      block.type === "tool_use" && block.name === "Skill" && block.input?.skill === skillName,
  );
}

// fallow-ignore-next-line complexity
function summarizeEvent(event: StreamEvent): string {
  if (event.type === "system") {
    return event.subtype ? `system:${event.subtype}` : "system";
  }
  if (event.type === "assistant") {
    const parts: string[] = [];
    for (const block of event.message?.content ?? []) {
      if (block.type === "thinking") {
        parts.push("thinking");
      } else if (block.type === "tool_use") {
        const detail = block.name === "Skill" ? `(${String(block.input?.skill ?? "?")})` : "";
        parts.push(`→ ${block.name ?? "?"}${detail}`);
      } else if (block.type === "text" && block.text) {
        const preview = block.text.slice(0, 60);
        parts.push(`"${preview}${block.text.length > 60 ? "…" : ""}"`);
      }
    }
    return parts.length > 0 ? `assistant ${parts.join(", ")}` : "assistant";
  }
  if (event.type === "user") {
    const hasToolResult = (event.message?.content ?? []).some((b) => b.type === "tool_result");
    return hasToolResult ? "user:tool_result" : "user";
  }
  return event.type ?? "unknown";
}

// Streams stream-json output line-by-line and resolves as soon as the Skill
// tool use appears (or the agent exits / times out). Killing the subprocess
// early avoids waiting for the full multi-turn execution (~7 min) when we
// only need the first-turn trigger decision (~5-15 s).
// fallow-ignore-next-line complexity
export async function checkTriggered(
  query: string,
  skillName: string,
  agent: string,
  onStreamEvent?: (count: number, summary: string) => void,
): Promise<Omit<RunDebugInfo, "runNumber">> {
  return new Promise((resolve) => {
    const child = spawn(agent, ["-p", query, "--output-format", "stream-json", "--verbose"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let resolved = false;
    let triggered = false;
    let stderrOutput = "";
    let lineBuffer = "";
    let eventCount = 0;

    const done = (extra?: { error?: string }): void => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      child.kill();
      const stderrStr = stderrOutput.trim();
      resolve({
        triggered,
        ...(stderrStr ? { stderr: stderrStr } : {}),
        ...extra,
      });
    };

    // 60 s is enough to capture the first assistant turn where Skill tool use
    // would appear. Full execution can take minutes but we don't need it.
    const timer = setTimeout(() => done(), 60_000);

    // fallow-ignore-next-line complexity
    const handleData = (chunk: Buffer): void => {
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed) as StreamEvent;
          onStreamEvent?.(++eventCount, summarizeEvent(event));
          if (event.type === "assistant" && isSkillUse(event, skillName)) {
            triggered = true;
            done();
            return;
          }
          // result event = agent finished without triggering
          if (event.type === "result") {
            done();
            return;
          }
        } catch {
          // skip non-JSON lines (e.g. shell profile noise on stderr)
        }
      }
    };

    child.stdout?.on("data", handleData);

    child.stderr?.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    child.on("close", () => done());
    child.on("error", (err: Error) => done({ error: String(err) }));
  });
}
