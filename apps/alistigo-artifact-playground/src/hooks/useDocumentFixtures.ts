import type { AlistigoDocument } from "@alistigo/document-format";
import { useMemo } from "react";

const FIXTURES_RAW = import.meta.glob<AlistigoDocument>("../../fixtures/*.json", {
  eager: true,
  import: "default",
});

export function useDocumentFixtures(): string[] {
  return useMemo(() => {
    return Object.keys(FIXTURES_RAW)
      .map((path) => path.replace(/^.*\/(.*)\.json$/, "$1"))
      .sort();
  }, []);
}
