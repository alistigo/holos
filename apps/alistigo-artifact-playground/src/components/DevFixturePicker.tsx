/**
 * Dev-only overlay: lists every JSON file under `fixtures/` and lets you
 * swap the editor's document on the fly. Vite's `import.meta.glob` pulls
 * them in eagerly so no network roundtrip is needed.
 *
 * This component is mounted only when `import.meta.env.DEV === true` —
 * production builds drop it (and its fixtures) at build time via
 * tree-shaking.
 */

import type { AlistigoDocument } from "@alistigo/document-format";
import { type JSX, useMemo, useState } from "react";

// Eager import — runs at module load. Tree-shaken out of prod builds.
const FIXTURES_RAW = import.meta.glob<AlistigoDocument>("../../fixtures/*.json", {
  eager: true,
  import: "default",
});

interface FixtureEntry {
  name: string;
  document: AlistigoDocument;
}

function loadFixtures(): FixtureEntry[] {
  const entries: FixtureEntry[] = [];
  for (const [path, document] of Object.entries(FIXTURES_RAW)) {
    const name = path.replace(/^.*\/(.*)\.json$/, "$1");
    entries.push({ name, document });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

export interface DevFixturePickerProps {
  onPick: (document: AlistigoDocument) => void;
}

function DevFixturePicker({ onPick }: DevFixturePickerProps): JSX.Element | null {
  const fixtures = useMemo(loadFixtures, []);
  const [selected, setSelected] = useState<string>("");

  if (fixtures.length === 0) {
    return null;
  }

  return (
    <aside className="fixed top-2 right-2 px-3 py-2 bg-black/75 text-white font-mono text-xs rounded z-[9999]">
      <label>
        <span className="mr-1.5">fixture:</span>
        <select
          value={selected}
          onChange={(e) => {
            const name = e.target.value;
            setSelected(name);
            const found = fixtures.find((f) => f.name === name);
            if (found != null) {
              onPick(found.document);
            }
          }}
        >
          <option value="">— pick —</option>
          {fixtures.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}

export default DevFixturePicker;
