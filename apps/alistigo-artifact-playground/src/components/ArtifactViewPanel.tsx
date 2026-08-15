import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX, RefObject } from "react";
import { useMemo, useState } from "react";
import { SourceView } from "./SourceView";

type Tab = "app" | "source" | "config" | "ai-input";

interface ArtifactViewPanelProps {
  srcdoc: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  reloadKey: number;
  iframeAllow: string;
  configJson: string;
  aiInput: string | undefined;
}

function JsonPanel({ json }: { json: string }): JSX.Element {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(json) as object;
    } catch {
      return null;
    }
  }, [json]);

  if (parsed === null) {
    return (
      <pre className="p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap break-all overflow-auto h-full">
        {json}
      </pre>
    );
  }

  return (
    <div className="p-3 overflow-auto h-full text-xs">
      <JsonView value={parsed} style={lightTheme as React.CSSProperties} />
    </div>
  );
}

function AiInputPanel({ markdown }: { markdown: string | undefined }): JSX.Element {
  if (markdown === undefined || markdown.trim() === "") {
    return (
      <p className="p-3 text-xs text-gray-400 italic">
        No AI input — default empty list will boot.
      </p>
    );
  }
  return (
    <pre className="p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap break-all overflow-auto h-full">
      {markdown}
    </pre>
  );
}

// fallow-ignore-next-line complexity
export function ArtifactViewPanel({
  srcdoc,
  iframeRef,
  reloadKey,
  iframeAllow,
  configJson,
  aiInput,
}: ArtifactViewPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>("app");

  const tabs: { id: Tab; label: string }[] = [
    { id: "app", label: "App" },
    { id: "source", label: "Source" },
    { id: "config", label: "Config" },
    { id: "ai-input", label: "AI Input" },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Banner — host app chrome, sits above the iframe */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border-b border-gray-200 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs rounded font-medium cursor-pointer ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Iframe always mounted to preserve state; hidden via CSS when not on app tab */}
        <iframe
          key={reloadKey}
          ref={iframeRef}
          srcDoc={srcdoc}
          title="Artifact preview"
          name="artifact-preview"
          className="h-full w-full border-none"
          style={{ display: activeTab === "app" ? "block" : "none" }}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          data-no-service-worker="true"
          allow={iframeAllow}
        />
        {activeTab === "source" && <SourceView html={srcdoc} />}
        {activeTab === "config" && <JsonPanel json={configJson} />}
        {activeTab === "ai-input" && <AiInputPanel markdown={aiInput} />}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 px-3 py-1.5 bg-gray-50">
        <p className="text-[10px] text-gray-400">
          Built with the{" "}
          <span className="font-medium text-gray-500">alistigo framework for artifacts</span>. The
          full source — framework, plugins, and this demo — is available at{" "}
          <a
            href="https://github.com/alistigo/holos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            github.com/alistigo/holos
          </a>
          . Open source and free to use.
        </p>
      </div>
    </div>
  );
}
