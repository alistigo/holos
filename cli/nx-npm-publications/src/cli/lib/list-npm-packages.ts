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
// For a user (not org) scope, that endpoint also returns the user's unscoped
// packages, so keep only names inside the scope.
async function listOrgPackageNames(scope: string): Promise<string[]> {
  const org = scope.replace(/^@/, "").replace(/\/$/, "");
  const perms = await getJson<Record<string, string>>(`${REGISTRY}/-/org/${org}/package`);
  return Object.keys(perms).filter((name) => name.startsWith(`@${org}/`));
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

/**
 * Users with access to `name` and their level ("write" or "read"). Public
 * endpoint: works without a token, so token restrictions can't block it.
 */
export async function fetchCollaborators(name: string): Promise<Record<string, string>> {
  return getJson<Record<string, string>>(
    `${REGISTRY}/-/package/${name.replace("/", "%2F")}/collaborators`,
  );
}
