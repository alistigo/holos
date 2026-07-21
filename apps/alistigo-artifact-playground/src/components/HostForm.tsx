import type { Dispatch, JSX, SetStateAction } from "react";
import { AI_CONTEXTS, getAvailablePlugins, KNOWN_APPS } from "../constants";
import type { Config } from "../hooks/useHostConfig";

interface HostFormProps {
  config: Config;
  onConfigChange: Dispatch<SetStateAction<Config>>;
  onReload: () => void;
  onClearData: () => void;
  documentNames: string[];
}

function HostForm({
  config,
  onConfigChange,
  onReload,
  onClearData,
  documentNames,
}: HostFormProps): JSX.Element {
  const availablePlugins = getAvailablePlugins(config.app);

  function togglePlugin(pluginName: string, enabled: boolean): void {
    onConfigChange((c) => {
      const plugins = { ...c.plugins };
      if (enabled) {
        plugins[pluginName] = plugins[pluginName] ?? {};
      } else {
        delete plugins[pluginName];
      }
      return { ...c, plugins };
    });
  }

  return (
    <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto flex flex-col gap-3 bg-gray-50">
      <h2 className="m-0 text-base font-semibold">Dev Config</h2>

      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-600">Artifact</span>
        <select
          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
          value={config.app}
          onChange={(e) => onConfigChange((c) => ({ ...c, app: e.target.value, document: "" }))}
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

      {config.app === "@alistigo/artifact-list" && (
        <label className="flex flex-col gap-1">
          <span className="font-medium text-gray-600">Document</span>
          <select
            className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={config.document}
            onChange={(e) => onConfigChange((c) => ({ ...c, document: e.target.value }))}
          >
            <option value="">— default —</option>
            {documentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}

      {availablePlugins.length > 0 && (
        <fieldset className="flex flex-col gap-1.5 border border-gray-200 rounded p-2">
          <legend className="font-medium text-gray-600 px-1">Plugins</legend>
          {availablePlugins.map((pluginName) => (
            <label key={pluginName} className="flex flex-row items-center gap-2">
              <input
                type="checkbox"
                checked={pluginName in config.plugins}
                onChange={(e) => togglePlugin(pluginName, e.target.checked)}
              />
              <span className="text-gray-600">{pluginName}</span>
            </label>
          ))}
        </fieldset>
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
