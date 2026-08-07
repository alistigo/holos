import type { JSX } from "react";
import { useState } from "react";
import type { AiLogEntry } from "../hooks/useClaudeCompleteSimulator";
import type { DownloadLogEntry } from "../hooks/useDownloadSimulator";
import type { NavLogEntry } from "../hooks/useNavigationSimulator";
import type { FetchLogEntry } from "../hooks/useProxyFetchSimulator";
import { StorageExplorer } from "./StorageExplorer";

type SimTab = "storage" | "ai" | "fetch" | "downloads" | "navigation";

export interface ClaudeSimulatorProps {
  aiContext: string;
  simulatorDelayMs: number;
  onSimulatorDelayChange: (ms: number) => void;
  suppressResponses: boolean;
  onSuppressResponsesChange: (v: boolean) => void;
  localEntries: [string, string][];
  privateEntries: [string, string][];
  sharedEntries: [string, string][];
  onDeleteEntry: (key: string, shared: boolean) => void;
  onSetEntry: (key: string, value: string, shared: boolean) => void;
  onClearSimulatorStorage: () => void;
  aiLogs: AiLogEntry[];
  onClearAiLogs: () => void;
  cannedResponse: string;
  onCannedResponseChange: (v: string) => void;
  errorMode: boolean;
  onErrorModeChange: (v: boolean) => void;
  fetchLogs: FetchLogEntry[];
  onClearFetchLogs: () => void;
  downloadLogs: DownloadLogEntry[];
  onClearDownloadLogs: () => void;
  navLogs: NavLogEntry[];
  onClearNavLogs: () => void;
  autoOpen: boolean;
  onAutoOpenChange: (v: boolean) => void;
  published: boolean;
  onPublishedChange: (v: boolean) => void;
  onClearData: () => void;
}

const SIM_TABS: { id: SimTab; label: string }[] = [
  { id: "storage", label: "Storage" },
  { id: "ai", label: "AI" },
  { id: "fetch", label: "Fetch" },
  { id: "downloads", label: "Downloads" },
  { id: "navigation", label: "Navigation" },
];

function fmt(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogHeader({ count, onClear }: { count: number; onClear: () => void }): JSX.Element {
  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 bg-gray-50">
      <span className="text-xs text-gray-500 flex-1">
        {count} event{count !== 1 ? "s" : ""}
      </span>
      {count > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function EmptyLog({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex items-center justify-center flex-1 text-gray-400 text-xs p-4 text-center">
      {message}
    </div>
  );
}

function NotClaudeContext(): JSX.Element {
  return (
    <div className="flex items-center justify-center flex-1 text-gray-400 text-xs p-4 text-center">
      Switch AI context to "claude" to enable this simulator.
    </div>
  );
}

// fallow-ignore-next-line complexity
function AiSubTab({
  logs,
  onClearLogs,
  cannedResponse,
  onCannedResponseChange,
  errorMode,
  onErrorModeChange,
  aiContext,
}: {
  logs: AiLogEntry[];
  onClearLogs: () => void;
  cannedResponse: string;
  onCannedResponseChange: (v: string) => void;
  errorMode: boolean;
  onErrorModeChange: (v: boolean) => void;
  aiContext: string;
}): JSX.Element {
  if (aiContext !== "claude") return <NotClaudeContext />;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 p-3 border-b border-gray-100 space-y-2">
        <div>
          <label htmlFor="ai-canned-response" className="block text-xs text-gray-500 mb-1">
            Canned response
          </label>
          <textarea
            id="ai-canned-response"
            value={cannedResponse}
            onChange={(e) => onCannedResponseChange(e.target.value)}
            rows={3}
            className="w-full resize-none text-xs font-mono border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={errorMode}
            onChange={(e) => onErrorModeChange(e.target.checked)}
            className="accent-red-500"
          />
          Error mode (return error instead of response)
        </label>
      </div>
      <LogHeader count={logs.length} onClear={onClearLogs} />
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <EmptyLog message="No claude.complete() calls yet — try the AI tab in the artifact." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {/* fallow-ignore-next-line complexity */}
            {logs.map((entry) => (
              <li key={entry.id} className="px-3 py-2 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-gray-400 text-[10px]">
                    {fmt(entry.timestamp)}
                  </span>
                  {entry.status === "pending" && (
                    <span className="text-yellow-600 font-medium">pending…</span>
                  )}
                  {entry.status === "done" && (
                    <span className="text-green-600 font-medium">done</span>
                  )}
                  {entry.status === "error" && (
                    <span className="text-red-600 font-medium">error</span>
                  )}
                </div>
                <div className="text-gray-700 truncate" title={entry.prompt}>
                  ↑ {entry.prompt}
                </div>
                {entry.status !== "pending" && (
                  <div
                    className={`truncate ${entry.status === "error" ? "text-red-500" : "text-gray-500"}`}
                    title={entry.response}
                  >
                    ↓ {entry.response}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// fallow-ignore-next-line complexity
function FetchSubTab({
  logs,
  onClearLogs,
  aiContext,
}: {
  logs: FetchLogEntry[];
  onClearLogs: () => void;
  aiContext: string;
}): JSX.Element {
  if (aiContext !== "claude") return <NotClaudeContext />;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 px-3 py-2 border-b border-gray-100 bg-blue-50">
        <p className="text-xs text-blue-700">
          Proxied via the playground page and subject to CORS restrictions.
        </p>
      </div>
      <LogHeader count={logs.length} onClear={onClearLogs} />
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <EmptyLog message="No fetch requests yet — try the API Calls tab in the artifact." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {/* fallow-ignore-next-line complexity */}
            {logs.map((entry) => (
              <li key={entry.id} className="px-3 py-2 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-gray-400 text-[10px]">
                    {fmt(entry.timestamp)}
                  </span>
                  <span className="font-mono font-semibold text-gray-700">{entry.method}</span>
                  {entry.status === "pending" && <span className="text-yellow-600">pending…</span>}
                  {entry.status === "done" && (
                    <span
                      className={`font-medium ${
                        entry.statusCode !== undefined && entry.statusCode < 400
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {entry.statusCode}
                    </span>
                  )}
                  {entry.status === "error" && (
                    <span className="text-red-600 font-medium">error</span>
                  )}
                </div>
                <div className="font-mono text-gray-500 truncate text-[10px]" title={entry.url}>
                  {entry.url}
                </div>
                {entry.error !== undefined && (
                  <div className="text-red-500 text-[10px] mt-0.5 truncate">{entry.error}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadsSubTab({
  logs,
  onClearLogs,
  aiContext,
}: {
  logs: DownloadLogEntry[];
  onClearLogs: () => void;
  aiContext: string;
}): JSX.Element {
  if (aiContext !== "claude") return <NotClaudeContext />;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <LogHeader count={logs.length} onClear={onClearLogs} />
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <EmptyLog message="No downloads yet — try the File Generation tab in the artifact." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {logs.map((entry) => (
              <li key={entry.id} className="px-3 py-2 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-gray-400 text-[10px]">
                    {fmt(entry.timestamp)}
                  </span>
                  <span className="text-green-600 font-medium">downloaded</span>
                </div>
                <div className="font-mono text-gray-700 truncate" title={entry.filename}>
                  {entry.filename}
                </div>
                <div className="text-gray-400 text-[10px]">
                  {entry.mimeType} · {formatBytes(entry.sizeBytes)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NavigationSubTab({
  logs,
  onClearLogs,
  autoOpen,
  onAutoOpenChange,
  aiContext,
}: {
  logs: NavLogEntry[];
  onClearLogs: () => void;
  autoOpen: boolean;
  onAutoOpenChange: (v: boolean) => void;
  aiContext: string;
}): JSX.Element {
  if (aiContext !== "claude") return <NotClaudeContext />;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoOpen}
            onChange={(e) => onAutoOpenChange(e.target.checked)}
            className="accent-blue-500"
          />
          Auto-open intercepted URLs in new tab
        </label>
      </div>
      <LogHeader count={logs.length} onClear={onClearLogs} />
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <EmptyLog message="No navigation events yet — try the External Navigation tab in the artifact." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {logs.map((entry) => (
              <li key={entry.id} className="px-3 py-2 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-gray-400 text-[10px]">
                    {fmt(entry.timestamp)}
                  </span>
                  <span className="text-blue-600 font-medium">intercepted</span>
                </div>
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-500 hover:underline truncate block text-[10px]"
                  title={entry.href}
                >
                  {entry.href}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// fallow-ignore-next-line complexity
export function ClaudeSimulator({
  aiContext,
  simulatorDelayMs,
  onSimulatorDelayChange,
  suppressResponses,
  onSuppressResponsesChange,
  localEntries,
  privateEntries,
  sharedEntries,
  onDeleteEntry,
  onSetEntry,
  onClearSimulatorStorage,
  aiLogs,
  onClearAiLogs,
  cannedResponse,
  onCannedResponseChange,
  errorMode,
  onErrorModeChange,
  fetchLogs,
  onClearFetchLogs,
  downloadLogs,
  onClearDownloadLogs,
  navLogs,
  onClearNavLogs,
  autoOpen,
  onAutoOpenChange,
  published,
  onPublishedChange,
  onClearData,
}: ClaudeSimulatorProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<SimTab>("storage");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Global delay + suppress controls */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <span className="text-xs text-gray-500 shrink-0">Delay</span>
        <input
          type="number"
          min={0}
          max={5000}
          step={100}
          value={simulatorDelayMs}
          onChange={(e) => onSimulatorDelayChange(Math.max(0, Number(e.target.value)))}
          className="w-20 text-xs border border-gray-200 rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400">ms</span>
        {aiContext === "claude" && (
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none ml-1">
            <input
              type="checkbox"
              checked={suppressResponses}
              onChange={(e) => onSuppressResponsesChange(e.target.checked)}
              className="accent-red-500"
            />
            Suppress storage
          </label>
        )}
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => onPublishedChange(e.target.checked)}
            className="accent-blue-500"
          />
          Published
        </label>
        <button
          type="button"
          onClick={onClearData}
          className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear data
        </button>
      </div>

      {/* Sub-tab bar */}
      <div className="shrink-0 flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
        {SIM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeTab === "storage" && (
        <StorageExplorer
          aiContext={aiContext}
          localEntries={localEntries}
          privateEntries={privateEntries}
          sharedEntries={sharedEntries}
          onDeleteEntry={onDeleteEntry}
          onSetEntry={onSetEntry}
          onClearAll={onClearSimulatorStorage}
        />
      )}
      {activeTab === "ai" && (
        <AiSubTab
          logs={aiLogs}
          onClearLogs={onClearAiLogs}
          cannedResponse={cannedResponse}
          onCannedResponseChange={onCannedResponseChange}
          errorMode={errorMode}
          onErrorModeChange={onErrorModeChange}
          aiContext={aiContext}
        />
      )}
      {activeTab === "fetch" && (
        <FetchSubTab logs={fetchLogs} onClearLogs={onClearFetchLogs} aiContext={aiContext} />
      )}
      {activeTab === "downloads" && (
        <DownloadsSubTab
          logs={downloadLogs}
          onClearLogs={onClearDownloadLogs}
          aiContext={aiContext}
        />
      )}
      {activeTab === "navigation" && (
        <NavigationSubTab
          logs={navLogs}
          onClearLogs={onClearNavLogs}
          autoOpen={autoOpen}
          onAutoOpenChange={onAutoOpenChange}
          aiContext={aiContext}
        />
      )}
    </div>
  );
}
