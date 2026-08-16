import {
  ArtifactErrorBoundary,
  useArtifactLifecycle,
  useStartArtifact,
} from "@alistigo/artifact-core";
import { ErrorScreen, LoadingScreen } from "@alistigo/artifact-core-components-react";
import type { AlistigoPlugin, KeyValueStore, PluginRuntime } from "@alistigo/artifact-plugin-api";
import { createPluginRuntime } from "@alistigo/artifact-plugin-api";
import { artifactContext } from "@alistigo/claude-artifact-api";
import type { AlistigoListStore } from "@alistigo/list-document-editor";
import type { AlistigoDocument } from "@alistigo/list-document-format";
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
import { ListKeyValueAdapter } from "../utils/list-key-value-adapter.js";
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
  rawStore: KeyValueStore | undefined;
  pluginName: string;
} {
  for (const p of plugins) {
    if (p.type === "storage" && p.storage?.isAvailable() === true) {
      const raw = p.storage.createStore();
      return { store: new ListKeyValueAdapter(raw), rawStore: raw, pluginName: p.name };
    }
  }
  return { store: new InMemoryListStore(), rawStore: undefined, pluginName: "in-memory" };
}
interface ReadyState {
  runtime: PluginRuntime;
  store: AlistigoListStore;
  storagePluginName: string;
  plugins: AlistigoPlugin[];
  spec: Record<string, Record<string, unknown>>;
  resolvedDoc: AlistigoDocument | undefined;
}

// fallow-ignore-next-line complexity
export function ArtifactRoot({ options }: { options: MountOptions }): ReactNode {
  const { published } = artifactContext();
  const lifecycle = useArtifactLifecycle();
  const [ready, setReady] = useState<ReadyState | null>(null);
  const isFirstMount = useRef(true);

  useStartArtifact(
    {
      onReady: async () => {
        const spec = buildPluginSpec(options.plugins);
        const plugins = await loadPlugins(spec);
        const { store, rawStore, pluginName } = resolveActiveStorage(plugins);

        // Published mode: prefer existing stored document over ai-input-action.
        // This ensures user edits survive re-renders / page reloads.
        let resolvedDoc = options.document;
        if (published && rawStore !== undefined) {
          const stored = await rawStore.get("document");
          if (stored != null) resolvedDoc = stored as AlistigoDocument;
        }

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
          storagePluginName: pluginName,
          plugins,
          spec,
          resolvedDoc,
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

  const { runtime, store, plugins, spec, resolvedDoc } = ready;
  const doc = resolvedDoc ?? makeDefaultDocument();

  return (
    <div style={{ position: "relative" }}>
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
          <App
            key={doc["alistigo:listId"]}
            initialDocument={doc}
            repository={store}
            plugins={plugins}
            spec={spec}
            isDraft={!published}
          />
          <DebugRenderErrorTrigger />
        </ArtifactErrorBoundary>
      </I18nProvider>
    </div>
  );
}
