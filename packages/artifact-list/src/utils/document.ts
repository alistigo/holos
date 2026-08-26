import type { AlistigoDocument } from "@alistigo/list-document-format";

function makeDefaultDocument(): AlistigoDocument {
  return {
    "@context": {
      "@vocab": "https://schema.org/",
      alistigo: "https://alistigo.ai/vocab/",
    },
    "@type": "ItemList",
    "alistigo:listId": "lst_01jx0000000000000000000000",
    "alistigo:schemaVersion": "1.0.0",
    name: "My List",
    itemListElement: [],
    "alistigo:eventLog": [],
  };
}

export default makeDefaultDocument;
