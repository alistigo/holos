import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface EvalQuery {
  query: string;
  should_trigger: boolean;
  split: "train" | "validation";
}

export interface QueryResult {
  query: EvalQuery;
  triggers: number;
  totalRuns: number;
  passed: boolean;
}

function parseTriggered(stdout: string, skillName: string): boolean {
  try {
    const output = JSON.parse(stdout) as {
      messages?: Array<{
        content?: Array<{
          type?: string;
          name?: string;
          input?: Record<string, unknown>;
        }>;
      }>;
    };
    return (output.messages ?? []).some((msg) =>
      (msg.content ?? []).some(
        (block) =>
          block.type === "tool_use" && block.name === "Skill" && block.input?.skill === skillName,
      ),
    );
  } catch {
    return false;
  }
}

// fallow-ignore-next-line complexity
export async function checkTriggered(
  query: string,
  skillName: string,
  agent: string,
): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(agent, ["-p", query, "--output-format", "json"], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    });
    return parseTriggered(String(stdout), skillName);
  } catch (err: unknown) {
    if (err !== null && typeof err === "object" && "stdout" in err) {
      const raw = (err as { stdout: unknown }).stdout;
      if (typeof raw === "string" && raw.length > 0) {
        return parseTriggered(raw, skillName);
      }
    }
    return false;
  }
}
