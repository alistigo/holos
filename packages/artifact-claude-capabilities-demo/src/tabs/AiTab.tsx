import type { JSX } from "react";
import { useRef, useState } from "react";

type RequestEntry =
  | { id: string; prompt: string; status: "pending" }
  | { id: string; prompt: string; status: "result"; response: string }
  | { id: string; prompt: string; status: "error"; error: string };

function Spinner(): JSX.Element {
  return (
    <svg
      className="h-4 w-4 animate-spin text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function AiTab(): JSX.Element {
  const [prompt, setPrompt] = useState("What is the meaning of life?");
  const [entries, setEntries] = useState<RequestEntry[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // fallow-ignore-next-line complexity
  async function handleSubmit(): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const id = crypto.randomUUID();
    setEntries((prev) => [{ id, prompt: trimmed, status: "pending" }, ...prev]);

    try {
      if (!window.claude) throw new Error("window.claude is not available in this environment.");
      const response = await window.claude.complete(trimmed);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { id, prompt: trimmed, status: "result", response } : e)),
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { id, prompt: trimmed, status: "error", error } : e)),
      );
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 p-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
          window.claude.complete(prompt)
        </p>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              void handleSubmit();
            }
          }}
          rows={3}
          placeholder="Enter a prompt… (Ctrl+Enter to send)"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={!prompt.trim()}
          onClick={() => {
            void handleSubmit();
          }}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
        >
          Ask Claude
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 && (
          <p className="text-center text-sm text-gray-400">Responses will appear here.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Prompt: <span className="text-gray-800">{entry.prompt}</span>
            </p>
            {entry.status === "pending" && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner /> Waiting for Claude…
              </div>
            )}
            {entry.status === "result" && (
              <p className="whitespace-pre-wrap text-sm text-gray-800">{entry.response}</p>
            )}
            {entry.status === "error" && (
              <p className="text-sm text-red-600">Error: {entry.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
