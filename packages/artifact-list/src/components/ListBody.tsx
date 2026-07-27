import {
  AddElementInput,
  ListView,
  useAlistigoActions,
  useAlistigoDocument,
} from "@alistigo/list-components-react";
import { Trans } from "@lingui/react/macro";
import type { JSX } from "react";

function ListBody(): JSX.Element {
  const document = useAlistigoDocument();
  const actions = useAlistigoActions();

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {document.name ?? <Trans>Untitled</Trans>}
      </h1>
      <AddElementInput onAdd={actions.addElement} />
      <ListView items={document.itemListElement} onDelete={actions.deleteElement} />
    </>
  );
}

export default ListBody;
