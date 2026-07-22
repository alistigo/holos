import type { JSX, RefObject } from "react";
import { useState } from "react";
import { SourceView } from "./SourceView";

type Tab = "app" | "source";

interface ArtifactViewPanelProps {
  srcdoc: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  reloadKey: number;
  iframeAllow: string;
}

export function ArtifactViewPanel({
  srcdoc,
  iframeRef,
  reloadKey,
  iframeAllow,
}: ArtifactViewPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>("app");

  return (
    <div className="flex flex-col h-full w-full">
      {/* Banner — host app chrome, sits above the iframe */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border-b border-gray-200 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("app")}
          className={`px-3 py-1 text-xs rounded font-medium cursor-pointer ${
            activeTab === "app"
              ? "bg-white shadow-sm text-gray-900 border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          App
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("source")}
          className={`px-3 py-1 text-xs rounded font-medium cursor-pointer ${
            activeTab === "source"
              ? "bg-white shadow-sm text-gray-900 border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Source
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === "app" ? (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={srcdoc}
            title="Artifact preview"
            name="artifact-preview"
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            data-no-service-worker="true"
            allow={iframeAllow}
          />
        ) : (
          <SourceView html={srcdoc} />
        )}
      </div>
    </div>
  );
}
