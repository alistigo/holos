import type { ApiOperation, ArtifactApiDefinition } from "@alistigo/ai-chat-async-api";
import type { JSX, RefObject } from "react";
import { useState } from "react";
import { type ApiCallEntry, useApiSimulator } from "../hooks/useApiSimulator";

interface OperationFormProps {
  name: string;
  op: ApiOperation;
  onSend: (action: string, params: Record<string, unknown>) => void;
}

// fallow-ignore-next-line complexity
function OperationForm({ name, op, onSend }: OperationFormProps): JSX.Element {
  const properties = op.params?.properties ?? {};
  const required = op.params?.required ?? [];
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(Object.keys(properties).map((k) => [k, ""])),
  );

  function handleSend() {
    const params: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      params[k] = v;
    }
    onSend(name, params);
  }

  const canSend = required.every((k) => (fields[k] ?? "").trim() !== "");

  return (
    <div className="border border-gray-200 rounded p-2 space-y-2 bg-white">
      <div className="font-medium text-gray-800">{name}</div>
      {op.description !== undefined && <div className="text-gray-500">{op.description}</div>}
      {Object.entries(properties).map(([paramName, schema]) => (
        <div key={paramName} className="flex items-center gap-2">
          <label
            className="text-gray-600 w-20 shrink-0 text-right"
            htmlFor={`${name}-${paramName}`}
          >
            {paramName}
          </label>
          <input
            id={`${name}-${paramName}`}
            type="text"
            className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
            placeholder={schema.description ?? paramName}
            value={fields[paramName] ?? ""}
            onChange={(e) => setFields((prev) => ({ ...prev, [paramName]: e.target.value }))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className="text-xs px-3 py-1 rounded bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}

const STATUS_CLASSES: Record<ApiCallEntry["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: ApiCallEntry["status"] }): JSX.Element {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_CLASSES[status]}`}>
      {status}
    </span>
  );
}

function CallLogEntry({ entry }: { entry: ApiCallEntry }): JSX.Element {
  return (
    <div className="border border-gray-100 rounded p-1.5 bg-white space-y-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
        <span className="font-medium text-gray-800">{entry.action}</span>
        <StatusBadge status={entry.status} />
      </div>
      {Object.keys(entry.params).length > 0 && (
        <div className="text-gray-500 font-mono truncate">{JSON.stringify(entry.params)}</div>
      )}
      {entry.error !== undefined && <div className="text-red-600">{entry.error}</div>}
    </div>
  );
}

interface AiApiTabProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  apiDefinition: ArtifactApiDefinition;
}

export function AiApiTab({ iframeRef, apiDefinition }: AiApiTabProps): JSX.Element {
  const { callLog, sendCall } = useApiSimulator(iframeRef);

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="font-semibold text-gray-700">
          {apiDefinition.info.title}{" "}
          <span className="font-normal text-gray-400">v{apiDefinition.info.version}</span>
        </div>
        {Object.entries(apiDefinition.operations).map(([name, op]) => (
          <OperationForm key={name} name={name} op={op} onSend={sendCall} />
        ))}
      </div>
      <div className="h-52 overflow-auto p-3 space-y-1 bg-gray-50 border-t border-gray-200 shrink-0">
        <div className="font-semibold text-gray-600 mb-1 sticky top-0 bg-gray-50 py-0.5">
          Call log
        </div>
        {callLog.length === 0 ? (
          <div className="text-gray-400">No calls sent yet</div>
        ) : (
          [...callLog].reverse().map((entry) => <CallLogEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
