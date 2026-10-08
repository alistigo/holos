const REGISTRY = "https://registry.npmjs.org";

export interface NpmPackage {
  name: string;
  /** Latest published version, or null when the dist-tags lookup fails (e.g. unpublished). */
  version: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`npm registry error: ${resp.status} ${resp.statusText} (${url})`);
  }
  return (await resp.json()) as T;
}

// The search API (/-/v1/search?text=scope:x) doesn't reliably index scoped
// packages, so list them from the org endpoint, which is public and complete.
async function listOrgPackageNames(scope: string): Promise<string[]> {
  const org = scope.replace(/^@/, "");
  const perms = await getJson<Record<string, string>>(`${REGISTRY}/-/org/${org}/package`);
  return Object.keys(perms);
}

async function fetchLatestVersion(name: string): Promise<string | null> {
  try {
    const tags = await getJson<{ latest?: string }>(
      `${REGISTRY}/-/package/${name.replace("/", "%2F")}/dist-tags`,
    );
    return tags.latest ?? null;
  } catch {
    return null;
  }
}

export async function listNpmPackageDetails(scope: string): Promise<NpmPackage[]> {
  const names = await listOrgPackageNames(scope);
  return Promise.all(
    names.map(async (name) => ({ name, version: await fetchLatestVersion(name) })),
  );
}

export async function listNpmPackages(scope: string): Promise<string[]> {
  return listOrgPackageNames(scope);
}
