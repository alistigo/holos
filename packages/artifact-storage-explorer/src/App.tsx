import { useArtifactLifecycle, useStartArtifact } from "@alistigo/artifact-core";
import {
  ArtifactContextMenuContainer,
  ArtifactInfoPanel,
  alistigoLogoUrl,
  ErrorScreen,
  LoadingScreen,
  Modal,
  type PluginInfo,
} from "@alistigo/artifact-core-components-react";
import { artifactContext } from "@alistigo/claude-artifact-api";
import claudeStoragePlugin from "@alistigo/claude-storage-plugin";
import { StorageExplorerApp } from "@alistigo/explorer-components-react";
import { type JSX, useState } from "react";
import pkg from "../package.json" with { type: "json" };

interface AppProps {
  prefix: string;
}

const ARTIFACT_NAME = "@alistigo/artifact-storage-explorer";

const PLUGIN_INFOS: PluginInfo[] = [
  {
    name: claudeStoragePlugin.name,
    version: claudeStoragePlugin.version ?? "?",
    type: claudeStoragePlugin.type ?? "storage",
    status: "active",
  },
];

function DraftWarningModal({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <Modal title="Draft mode — storage limitations" onClose={onClose}>
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          This artifact is running in <strong>draft mode</strong> (AI preview panel). The{" "}
          <code className="rounded bg-gray-100 px-1">window.storage</code> API has important
          limitations here:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Version-siloed storage.</strong> Each time the AI regenerates the artifact, a
            new version is created. Storage is not shared between versions — data written in one
            version is invisible to the next.
          </li>
          <li>
            <strong>Shared keys do nothing.</strong> The{" "}
            <code className="rounded bg-gray-100 px-1">shared: true</code> flag has no effect in
            draft mode. Cross-user sharing only works on the published public URL.
          </li>
          <li>
            <strong>Writes are blocked.</strong> The storage plugin throws an error on any{" "}
            <code className="rounded bg-gray-100 px-1">set</code> or{" "}
            <code className="rounded bg-gray-100 px-1">delete</code> call in draft mode to make this
            limitation explicit rather than silently failing.
          </li>
        </ul>
        <p className="pt-1 font-medium text-orange-700">
          To use the storage explorer, publish this artifact and open it via its public URL.
        </p>
      </div>
    </Modal>
  );
}

function DraftBadge({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center gap-1 rounded-b-lg border border-orange-300 bg-orange-50 px-2 text-xs font-medium text-orange-700 shadow-md hover:bg-orange-100 focus:outline-none"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      Draft
    </button>
  );
}

function DraftOverlay({ onLearnMore }: { onLearnMore: () => void }): JSX.Element {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-400/60">
      <div className="max-w-sm rounded-xl bg-white p-8 text-center shadow-xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto h-12 w-12 text-orange-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Draft mode</h2>
        <p className="mt-2 text-sm text-gray-600">
          Storage is unavailable while this artifact is in draft. Publish it and open the public
          link to use the storage explorer.
        </p>
        <button
          type="button"
          onClick={onLearnMore}
          className="mt-4 text-sm font-medium text-orange-600 hover:underline focus:outline-none"
        >
          Learn about draft limitations
        </button>
      </div>
    </div>
  );
}

// fallow-ignore-next-line complexity
function ReadyContent({ isDraft, prefix }: { isDraft: boolean; prefix: string }): JSX.Element {
  const [infoOpen, setInfoOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  return (
    <>
      {draftModalOpen && <DraftWarningModal onClose={() => setDraftModalOpen(false)} />}
      {infoOpen && (
        <Modal title={ARTIFACT_NAME} onClose={() => setInfoOpen(false)}>
          <ArtifactInfoPanel
            artifactName={ARTIFACT_NAME}
            artifactVersion={pkg.version}
            plugins={PLUGIN_INFOS}
          />
        </Modal>
      )}

      <ArtifactContextMenuContainer
        icon={<img src={alistigoLogoUrl} alt="" className="h-full w-full object-cover" />}
        statusBadge={isDraft ? <DraftBadge onClick={() => setDraftModalOpen(true)} /> : undefined}
      >
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label="Open artifact info"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 text-gray-600"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="8.01" strokeLinecap="round" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
          </svg>
        </button>
      </ArtifactContextMenuContainer>

      <StorageExplorerApp prefix={prefix} />

      {isDraft && <DraftOverlay onLearnMore={() => setDraftModalOpen(true)} />}
    </>
  );
}

export function App({ prefix }: AppProps): JSX.Element {
  const lifecycle = useArtifactLifecycle();
  const isDraft = !artifactContext().published;

  useStartArtifact(
    {
      onReady: async () => {
        if (isDraft) return;
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
    return <LoadingScreen artifactName={ARTIFACT_NAME} />;
  }

  if (phase === "error") {
    return <ErrorScreen error={error ?? new Error("Unknown startup error")} />;
  }

  return <ReadyContent isDraft={isDraft} prefix={prefix} />;
}
