import { useArtifactLifecycle, useStartArtifact } from "@alistigo/artifact-core";
import { ErrorScreen, LoadingScreen } from "@alistigo/artifact-core-components-react";
import claudeStoragePlugin from "@alistigo/claude-storage-plugin";
import { StorageExplorerApp } from "@alistigo/explorer-components-react";
import type { JSX } from "react";

interface AppProps {
  prefix: string;
}

export function App({ prefix }: AppProps): JSX.Element {
  const lifecycle = useArtifactLifecycle();

  useStartArtifact(
    {
      onReady: async () => {
        if (!claudeStoragePlugin.storage?.isAvailable()) {
          throw new Error(
            "Claude storage is not available — this artifact must run inside a Claude conversation.",
          );
        }
        const store = claudeStoragePlugin.storage.createStore();
        await store.list("");
      },
    },
    lifecycle,
  );

  const { phase, error } = lifecycle;

  if (phase === "loading") {
    return <LoadingScreen artifactName="@alistigo/artifact-storage-explorer" />;
  }

  if (phase === "error") {
    return <ErrorScreen error={error ?? new Error("Unknown startup error")} />;
  }

  return <StorageExplorerApp prefix={prefix} />;
}
