import { useMemo } from "react";

const FIXTURES_RAW = import.meta.glob<string>("../../fixtures/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export function useDocumentFixtures(): string[] {
  return useMemo(() => {
    return Object.keys(FIXTURES_RAW)
      .map((path) => path.replace(/^.*\/(.*)\.md$/, "$1"))
      .sort();
  }, []);
}

export function useMarkdownFixturesMap(): Map<string, string> {
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const [path, markdown] of Object.entries(FIXTURES_RAW)) {
      const name = path.replace(/^.*\/(.*)\.md$/, "$1");
      map.set(name, markdown);
    }
    return map;
  }, []);
}
