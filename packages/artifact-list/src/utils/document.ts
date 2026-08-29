import type { AlistigoDocument } from "@alistigo/list-document";
import { ALISTIGO_CONTEXT } from "@alistigo/list-document";

function makeDefaultDocument(): AlistigoDocument {
  return {
    "@context": ALISTIGO_CONTEXT,
    "@type": "ItemList",
    "@id": "lst_01jx0000000000000000000000",
    name: "My List",
    itemListElement: [],
    "alistigo:eventLog": [],
  };
}

export default makeDefaultDocument;
