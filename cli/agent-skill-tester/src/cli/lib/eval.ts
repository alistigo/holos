import { spawn } from "node:child_process";

export interface EvalQuery {
  query: string;
  should_trigger: boolean;
  split: "train" | "validation";
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

type StreamEvent = {
  type?: string;
  message?: {
    content?: Array<{
      type?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
  };
};

function isSkillUse(event: StreamEvent, skillName: string): boolean {
  return (event.message?.content ?? []).some(
    (block) =>
      block.type === "tool_use" && block.name === "Skill" && block.input?.skill === skillName,
  );
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
): Promise<Omit<RunDebugInfo, "runNumber">> {
  return new Promise((resolve) => {
    const child = spawn(agent, ["-p", query, "--output-format", "stream-json", "--verbose"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let resolved = false;
    let triggered = false;
    let stderrOutput = "";
    let lineBuffer = "";

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
