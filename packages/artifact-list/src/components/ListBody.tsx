import {
  AddElementInput,
  ListView,
  useAlistigoActions,
  useAlistigoDocument,
} from "@alistigo/list-components-react";
import { Trans } from "@lingui/react/macro";
import type { JSX } from "react";

interface ListBodyProps {
  isDraft: boolean;
}

function DraftBanner(): JSX.Element {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <span>
        <Trans>Preview — publish this artifact to start editing.</Trans>
      </span>
    </div>
  );
}

// fallow-ignore-next-line complexity
function ListBody({ isDraft }: ListBodyProps): JSX.Element {
  const document = useAlistigoDocument();
  const actions = useAlistigoActions();

  return (
    <>
      {isDraft && <DraftBanner />}
      <h1 className="text-xl font-semibold tracking-tight">
        {document.name ?? <Trans>Untitled</Trans>}
      </h1>
      {!isDraft && <AddElementInput onAdd={actions.addElement} />}
      <ListView
        items={document.itemListElement}
        {...(isDraft ? {} : { onDelete: actions.deleteElement })}
      />
    </>
  );
}

export default ListBody;
