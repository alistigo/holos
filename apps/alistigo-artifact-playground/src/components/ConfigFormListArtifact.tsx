import type { JSX } from "react";
import { getAvailablePlugins } from "../constants";

export interface ConfigFormListArtifactProps {
  app: string;
  plugins: Record<string, Record<string, unknown>>;
  document: string;
  rawDocument: string;
  documentNames: string[];
  onPluginsChange: (plugins: Record<string, Record<string, unknown>>) => void;
  onDocumentChange: (document: string, rawDocument: string) => void;
}

export function ConfigFormListArtifact({
  app,
  plugins,
  document,
  rawDocument,
  documentNames,
  onPluginsChange,
  onDocumentChange,
}: ConfigFormListArtifactProps): JSX.Element | null {
  const availablePlugins = getAvailablePlugins(app);

  if (availablePlugins.length === 0 && app !== "@alistigo/artifact-list") {
    return null;
  }

  function togglePlugin(pluginName: string, enabled: boolean): void {
    const next = { ...plugins };
    if (enabled) {
      next[pluginName] = next[pluginName] ?? {};
    } else {
      delete next[pluginName];
    }
    onPluginsChange(next);
  }

  function handlePluginConfigChange(pluginName: string, raw: string): void {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      onPluginsChange({ ...plugins, [pluginName]: parsed });
    } catch {
      /* ignore invalid JSON while typing */
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {availablePlugins.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-gray-600 text-xs">Plugins</span>
          <div className="flex flex-col gap-1 pl-0">
            {availablePlugins.map((pluginName) => (
              <div key={pluginName} className="flex flex-col gap-1">
                <label className="flex flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pluginName in plugins}
                    onChange={(e) => togglePlugin(pluginName, e.target.checked)}
                  />
                  <span className="text-gray-600 text-xs">{pluginName}</span>
                </label>
                {pluginName in plugins && (
                  <textarea
                    aria-label={`Config for ${pluginName}`}
                    className="px-2 py-1.5 border border-gray-300 rounded text-xs bg-white font-mono resize-y ml-6"
                    rows={2}
                    value={JSON.stringify(plugins[pluginName] ?? {})}
                    onChange={(e) => handlePluginConfigChange(pluginName, e.target.value)}
                    placeholder="{}"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {app === "@alistigo/artifact-list" && (
        <label className="flex flex-col gap-1">
          <span className="font-medium text-gray-600 text-xs">Document</span>
          <select
            className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={document}
            onChange={(e) =>
              onDocumentChange(e.target.value, e.target.value !== "__raw__" ? "" : rawDocument)
            }
          >
            <option value="">— default —</option>
            <option value="__raw__">— enter JSON —</option>
            {documentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {document === "__raw__" && (
            <textarea
              aria-label="Document JSON"
              className="px-2 py-1.5 border border-gray-300 rounded text-xs bg-white font-mono resize-y"
              rows={6}
              value={rawDocument}
              onChange={(e) => onDocumentChange("__raw__", e.target.value)}
              placeholder='{"@context": {"@vocab": "https://schema.org/", "alistigo": "https://alistigo.ai/vocab/"}, ...}'
            />
          )}
        </label>
      )}
    </div>
  );
}
