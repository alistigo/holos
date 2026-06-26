import type { JSX } from "react";
import { type Config, useHostConfig } from "../hooks/useHostConfig";
import { useIframeControls } from "../hooks/useIframeControls";
import HostForm from "./HostForm";

function buildIframeSrc(config: Config): string {
  const params = new URLSearchParams();
  params.set("app", config.app);
  params.set("lang", config.lang);
  params.set("aiContext", config.aiContext);
  if (config.app === "@alistigo/artifact-list") {
    params.set("readonly", String(config.readonly));
  }
  return `/iframe.html?${params.toString()}`;
}

function HostPage(): JSX.Element {
  const { config, setConfig } = useHostConfig();
  const { iframeRef, reloadKey, reload, clearData } = useIframeControls();

  return (
    <div className="flex h-full w-full font-sans text-sm">
      <HostForm
        config={config}
        onConfigChange={setConfig}
        onReload={reload}
        onClearData={clearData}
      />
      <div className="w-1/2 relative">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={buildIframeSrc(config)}
          title="Artifact preview"
          className="h-full w-full border-none"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          data-no-service-worker="true"
          allow="fullscreen, clipboard-write"
        />
      </div>
    </div>
  );
}

export default HostPage;
