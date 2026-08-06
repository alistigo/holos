import { Modal } from "@alistigo/artifact-core-components-react";
import { StorageExplorerApp } from "@alistigo/explorer-components-react";
import type { JSX } from "react";
import { useState } from "react";

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

function DraftOverlay({ onLearnMore }: { onLearnMore: () => void }): JSX.Element {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-gray-400/60">
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

interface StorageTabProps {
  isDraft: boolean;
  prefix: string;
}

export function StorageTab({ isDraft, prefix }: StorageTabProps): JSX.Element {
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {draftModalOpen && <DraftWarningModal onClose={() => setDraftModalOpen(false)} />}
      <StorageExplorerApp prefix={prefix} />
      {isDraft && <DraftOverlay onLearnMore={() => setDraftModalOpen(true)} />}
    </div>
  );
}
