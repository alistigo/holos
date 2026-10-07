interface NpmSearchObject {
  package: { name: string; version: string };
}

interface NpmSearchResult {
  objects: NpmSearchObject[];
  total: number;
}

async function fetchPage(bare: string, from: number): Promise<NpmSearchResult> {
  const url = `https://registry.npmjs.org/-/v1/search?text=scope:${bare}&size=250&from=${from}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`npm registry error: ${resp.status} ${resp.statusText}`);
  }
  return (await resp.json()) as NpmSearchResult;
}

// fallow-ignore-next-line complexity
export async function listNpmPackages(scope: string): Promise<string[]> {
  const bare = scope.replace(/^@/, "");
  const names: string[] = [];
  let from = 0;

  while (true) {
    const data = await fetchPage(bare, from);
    for (const obj of data.objects) names.push(obj.package.name);
    from += data.objects.length;
    if (from >= data.total || data.objects.length === 0) break;
  }

  return names;
}
