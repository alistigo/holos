import {
  ArtifactErrorBoundary,
  useArtifactLifecycle,
  useStartArtifact,
} from "@alistigo/artifact-core";
import type { PluginInfo } from "@alistigo/artifact-core-components-react";
import {
  AlistigoBadge,
  ArtifactInfoPanel,
  ErrorScreen,
  LoadingScreen,
} from "@alistigo/artifact-core-components-react";
import type { AlistigoPlugin, PluginRuntime } from "@alistigo/artifact-plugin-api";
import { createPluginRuntime } from "@alistigo/artifact-plugin-api";
import type { AlistigoListStore } from "@alistigo/list-document-editor";
import { createLogger } from "@alistigo/logger";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import pkg from "../../package.json" with { type: "json" };
import { bootI18n } from "../i18n.js";
import { buildPluginSpec, loadPlugins } from "../plugins.js";
import { registerLoadedPlugins } from "../runtime-state.js";
import type { MountOptions } from "../types.js";
import makeDefaultDocument from "../utils/document.js";
import { InMemoryListStore } from "../utils/in-memory-store.js";
import App from "./App.js";
import DebugRenderErrorTrigger from "./DebugRenderErrorTrigger.js";

const log = createLogger("alistigo:artifact-list");

const LOCALE = (import.meta.env.VITE_LOCALE as string | undefined) ?? "en";

const pluginLogger = {
  info: (obj: unknown, msg?: string) => log.info(obj as Record<string, unknown>, msg),
  error: (obj: unknown, msg?: string) => log.error(obj as Record<string, unknown>, msg),
};

function resolveActiveStorage(plugins: AlistigoPlugin[]): {
  store: AlistigoListStore;
  pluginName: string;
} {
  for (const p of plugins) {
    if (p.type === "storage" && p.storage?.isAvailable() === true) {
      return { store: p.storage.createStore(), pluginName: p.name };
    }
  }
  return { store: new InMemoryListStore(), pluginName: "in-memory" };
}

function buildPluginInfos(
  plugins: AlistigoPlugin[],
  spec: Record<string, Record<string, unknown>>,
): PluginInfo[] {
  return Object.keys(spec).map((pkgName) => {
    const plugin = plugins.find((p) => p.name === pkgName);
    if (plugin !== undefined) {
      return {
        name: plugin.name,
        version: "?",
        type: plugin.type ?? "unknown",
        status: "loaded" as const,
      };
    }
    return {
      name: pkgName,
      version: "?",
      type: "unknown",
      status: "error" as const,
      error: "Failed to load",
    };
  });
}

interface ReadyState {
  runtime: PluginRuntime;
  store: AlistigoListStore;
  pluginInfos: PluginInfo[];
  storagePluginName: string;
}

// fallow-ignore-next-line complexity
export function ArtifactRoot({ options }: { options: MountOptions }): ReactNode {
  const lifecycle = useArtifactLifecycle();
  const [ready, setReady] = useState<ReadyState | null>(null);
  const isFirstMount = useRef(true);

  useStartArtifact(
    {
      onReady: async () => {
        const spec = buildPluginSpec(options.plugins);
        const plugins = await loadPlugins(spec);
        const { store, pluginName } = resolveActiveStorage(plugins);
        const host = {
          packageName: "@alistigo/artifact-list",
          version: pkg.version,
          locale: LOCALE,
          environment: import.meta.env.MODE,
        };
        const runtime = createPluginRuntime(plugins, host, pluginLogger, spec);
        registerLoadedPlugins(runtime.loadedPluginNames);
        await runtime.setup();
        bootI18n();
        await runtime.beforeMount();
        setReady({
          runtime,
          store,
          pluginInfos: buildPluginInfos(plugins, spec),
          storagePluginName: pluginName,
        });
      },
    },
    lifecycle,
  );

  useEffect(() => {
    if (ready === null) return;
    void ready.runtime.mounted().then(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        ready.runtime.bus.emit("widget:displayed", {
          locale: LOCALE,
          storageType: ready.storagePluginName,
          version: pkg.version,
        });
      }
    });
  }, [ready]);

  const { phase, error } = lifecycle;

  if (phase === "loading") {
    return <LoadingScreen artifactName="@alistigo/artifact-list" />;
  }

  if (phase === "error") {
    return <ErrorScreen error={error ?? new Error("Unknown startup error")} />;
  }

  if (ready === null) return null;

  const { runtime, store, pluginInfos } = ready;
  const doc = options.document ?? makeDefaultDocument();

  return (
    <div style={{ position: "relative" }}>
      <AlistigoBadge>
        <ArtifactInfoPanel
          artifactName="@alistigo/artifact-list"
          artifactVersion={pkg.version}
          plugins={pluginInfos}
        />
      </AlistigoBadge>
      <I18nProvider i18n={i18n}>
        <ArtifactErrorBoundary
          onError={(err, componentStack) => {
            lifecycle.setPhase("error", err);
            runtime.bus.emit("error:uncaught", {
              error: err,
              ...(componentStack !== undefined && { componentStack }),
            });
          }}
        >
          <App key={doc["alistigo:listId"]} initialDocument={doc} repository={store} />
          <DebugRenderErrorTrigger />
        </ArtifactErrorBoundary>
      </I18nProvider>
    </div>
  );
}
