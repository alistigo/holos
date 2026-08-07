import type { JSX } from "react";
import { useState } from "react";

const SAMPLE_JSON = JSON.stringify(
  {
    artifact: "claude-capabilities-demo",
    generatedAt: new Date().toISOString(),
    data: [
      { id: 1, name: "Alice", role: "developer" },
      { id: 2, name: "Bob", role: "designer" },
    ],
  },
  null,
  2,
);

export function FileGenerationTab(): JSX.Element {
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastDownload, setLastDownload] = useState<string | null>(null);

  function handleChange(value: string): void {
    setJsonText(value);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function handleDownload(): void {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastDownload(new Date().toLocaleTimeString());
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 p-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
          URL.createObjectURL + download
        </p>
        <p className="text-sm text-gray-600">
          Edit the JSON below, then click Download. The Claude inject-script intercepts the{" "}
          <code className="rounded bg-gray-100 px-1">blob-request://</code> URL and triggers the
          download via the parent frame.
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-4 gap-3">
        <textarea
          value={jsonText}
          onChange={(e) => handleChange(e.target.value)}
          className={`flex-1 resize-none rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none ${
            parseError
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          }`}
          spellCheck={false}
        />
        {parseError && <p className="shrink-0 text-sm text-red-600">JSON error: {parseError}</p>}
        <div className="shrink-0 flex items-center gap-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={parseError !== null}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
          >
            Download JSON
          </button>
          {lastDownload && <p className="text-sm text-gray-500">Last download at {lastDownload}</p>}
        </div>
      </div>
    </div>
  );
}
