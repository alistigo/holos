import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useLogs } from "./useLogs";

/**
 * `window.claude.complete()` accepts either a plain string or an array of
 * content blocks — the draw-comments widget sends the latter, an image block
 * plus a text block. The bridge forwards whatever it is given verbatim.
 */
export type ClaudePromptBlock =
  | { type: "text"; text?: string }
  | { type: "image"; source?: { type?: string; media_type?: string; data?: string } }
  | { type: string; [key: string]: unknown };

export type ClaudePrompt = string | ClaudePromptBlock[];

export type AiLogEntry = {
  id: string;
  /** Rendered in the log. Always a string — see `describePrompt`. */
  prompt: string;
  /** The prompt as the artifact actually sent it, for inspection. */
  rawPrompt: ClaudePrompt;
  response: string;
  status: "pending" | "done" | "error";
  timestamp: number;
};

/** One-line summary of a text block, for the log. */
function describeTextBlock(block: ClaudePromptBlock): string {
  const text = (block as { text?: unknown }).text;
  return typeof text === "string" && text.length > 0 ? text : "(empty text)";
}

/** One-line summary of an image block, for the log. */
function describeImageBlock(block: ClaudePromptBlock): string {
  const data = (block as { source?: { data?: unknown } }).source?.data;
  const bytes = typeof data === "string" ? data.length : 0;
  return `[image ${bytes} base64 chars]`;
}

function describeBlock(block: ClaudePromptBlock): string {
  if (block.type === "text") return describeTextBlock(block);
  if (block.type === "image") return describeImageBlock(block);
  return `[${block.type}]`;
}

/**
 * Collapses a prompt to a single line for the log.
 *
 * This exists because a content-block array is not a valid React child:
 * rendering one directly throws "Objects are not valid as a React child" and
 * takes down the whole host page the moment an artifact sends an image prompt.
 */
function describePrompt(prompt: ClaudePrompt): string {
  if (typeof prompt === "string") return prompt;
  if (!Array.isArray(prompt)) return String(prompt);
  return prompt.map(describeBlock).join(" + ");
}

// fallow-ignore-next-line complexity
export function useClaudeCompleteSimulator(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  delayMs: number,
) {
  const [cannedResponse, setCannedResponse] = useState(
    "This is a simulated claude.complete() response from the playground.",
  );
  const [errorMode, setErrorMode] = useState(false);
  const { logs, setLogs, clearLogs } = useLogs<AiLogEntry>();

  const delayMsRef = useRef(delayMs);
  delayMsRef.current = delayMs;
  const cannedRef = useRef(cannedResponse);
  cannedRef.current = cannedResponse;
  const errorRef = useRef(errorMode);
  errorRef.current = errorMode;

  useEffect(() => {
    if (!enabled) return;

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const msg = event.data as { type: string; id?: string; prompt?: ClaudePrompt };
      if (msg.type !== "claudeComplete") return;

      const id = msg.id ?? "";
      const rawPrompt = msg.prompt ?? "";
      setLogs((prev) => [
        {
          id,
          prompt: describePrompt(rawPrompt),
          rawPrompt,
          response: "",
          status: "pending",
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      function respond(w: Window) {
        if (errorRef.current) {
          w.postMessage(
            { type: "claudeComplete", id, error: "Simulated error from playground" },
            "*",
          );
          setLogs((prev) =>
            prev.map((e) =>
              e.id === id ? { ...e, status: "error", response: "Simulated error" } : e,
            ),
          );
        } else {
          const completion = cannedRef.current;
          w.postMessage({ type: "claudeComplete", id, completion }, "*");
          setLogs((prev) =>
            prev.map((e) => (e.id === id ? { ...e, status: "done", response: completion } : e)),
          );
        }
      }

      const delay = delayMsRef.current;
      if (delay > 0) setTimeout(() => respond(win), delay);
      else respond(win);
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled, setLogs]);

  return { logs, clearLogs, cannedResponse, setCannedResponse, errorMode, setErrorMode };
}
