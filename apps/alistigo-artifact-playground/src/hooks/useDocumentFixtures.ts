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

export function useDocumentFixturesMap(): Map<string, AlistigoDocument> {
  return useMemo(() => {
    const map = new Map<string, AlistigoDocument>();
    for (const [path, doc] of Object.entries(FIXTURES_RAW)) {
      const name = path.replace(/^.*\/(.*)\.json$/, "$1");
      map.set(name, doc);
    }
    return map;
  }, []);
}
