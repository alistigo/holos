import type { AlistigoDocument } from "@alistigo/list";

function makeDefaultDocument(): AlistigoDocument {
  return {
    "@context": {
      "@vocab": "https://schema.org/",
      alistigo: "https://alistigo.ai/vocab/",
    },
    "@type": "ItemList",
    identifier: "lst_01jx0000000000000000000000",
    name: "My List",
    itemListElement: [],
    "alistigo:eventLog": [],
  };
}

export default makeDefaultDocument;
