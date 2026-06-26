import type { Dispatch, JSX, SetStateAction } from "react";
import { AI_CONTEXTS, KNOWN_APPS } from "../constants";
import type { Config } from "../hooks/useHostConfig";

interface HostFormProps {
  config: Config;
  onConfigChange: Dispatch<SetStateAction<Config>>;
  onReload: () => void;
  onClearData: () => void;
}

function HostForm({ config, onConfigChange, onReload, onClearData }: HostFormProps): JSX.Element {
  return (
    <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto flex flex-col gap-3 bg-gray-50">
      <h2 className="m-0 text-base font-semibold">Dev Config</h2>

      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-600">Artifact</span>
        <select
          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
          value={config.app}
          onChange={(e) => onConfigChange((c) => ({ ...c, app: e.target.value }))}
        >
          {KNOWN_APPS.map((app) => (
            <option key={app} value={app}>
              {app}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-600">Language</span>
        <input
          type="text"
          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
          value={config.lang}
          onChange={(e) => onConfigChange((c) => ({ ...c, lang: e.target.value }))}
          placeholder="en"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-600">AI Context</span>
        <select
          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
          value={config.aiContext}
          onChange={(e) => onConfigChange((c) => ({ ...c, aiContext: e.target.value }))}
          disabled
        >
          {AI_CONTEXTS.map((ctx) => (
            <option key={ctx} value={ctx}>
              {ctx}
            </option>
          ))}
        </select>
      </label>

      {config.app === "@alistigo/artifact-list" && (
        <label className="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            checked={config.readonly}
            onChange={(e) => onConfigChange((c) => ({ ...c, readonly: e.target.checked }))}
          />
          <span className="font-medium text-gray-600">Read-only</span>
        </label>
      )}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          className="px-3.5 py-1.5 border border-gray-300 rounded bg-white cursor-pointer text-sm hover:bg-gray-100"
          onClick={onReload}
        >
          Reload
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 border border-gray-300 rounded bg-white cursor-pointer text-sm hover:bg-gray-100"
          onClick={onClearData}
        >
          Clear data
        </button>
      </div>
    </div>
  );
}

export default HostForm;
