import type { JSX } from "react";
import { useState } from "react";
import { JsonEditor } from "../CodeHighlight";

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

const SAMPLE_CSV = `name,role,department
Alice,developer,engineering
Bob,designer,product
Carol,manager,engineering`;

export function FileGenerationTab(): JSX.Element {
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastJsonDownload, setLastJsonDownload] = useState<string | null>(null);

  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [lastCsvDownload, setLastCsvDownload] = useState<string | null>(null);

  function handleChange(value: string): void {
    setJsonText(value);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function handleJsonDownload(): void {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastJsonDownload(new Date().toLocaleTimeString());
  }

  function handleCsvDownload(): void {
    const bytes = new TextEncoder().encode(csvText);
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);
    const a = document.createElement("a");
    a.href = `data:text/csv;base64,${base64}`;
    a.download = "export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setLastCsvDownload(new Date().toLocaleTimeString());
  }

  return (
    <div className="flex flex-1 flex-col divide-y divide-gray-200 overflow-y-auto">
      {/* Blob / URL.createObjectURL path */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="mb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">
            URL.createObjectURL + download
          </p>
          <p className="text-sm text-gray-600">
            Encodes content as a Blob, then creates a{" "}
            <code className="rounded bg-gray-100 px-1">blob-request://</code> URL. The inject-script
            intercepts the click, reads the Blob as an ArrayBuffer, and triggers the download via
            the parent frame.
          </p>
        </div>
        <JsonEditor
          value={jsonText}
          onChange={handleChange}
          rows={8}
          hasError={parseError !== null}
        />
        {parseError && <p className="text-sm text-red-600">JSON error: {parseError}</p>}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleJsonDownload}
            disabled={parseError !== null}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
          >
            Download JSON
          </button>
          {lastJsonDownload && (
            <p className="text-sm text-gray-500">Last download at {lastJsonDownload}</p>
          )}
        </div>
      </div>

      {/* data: URI path */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="mb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">
            data: URI download
          </p>
          <p className="text-sm text-gray-600">
            Encodes content as a{" "}
            <code className="rounded bg-gray-100 px-1">data:text/csv;base64,…</code> URI directly in
            the <code className="rounded bg-gray-100 px-1">href</code>. The inject-script intercepts
            the click, parses the MIME type and base64 payload inline, and triggers the download via
            the parent frame — no Blob or object URL needed.
          </p>
        </div>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={6}
          className="resize-none rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
          spellCheck={false}
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCsvDownload}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
          >
            Download CSV
          </button>
          {lastCsvDownload && (
            <p className="text-sm text-gray-500">Last download at {lastCsvDownload}</p>
          )}
        </div>
      </div>
    </div>
  );
}
