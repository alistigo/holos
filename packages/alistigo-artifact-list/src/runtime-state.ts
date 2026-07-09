const mountedContainers: string[] = [];
let loadedPluginNames: readonly string[] = [];

export function registerMount(container: string): void {
  if (!mountedContainers.includes(container)) {
    mountedContainers.push(container);
  }
}

export function getMountedContainers(): readonly string[] {
  return mountedContainers;
}

/** Records the plugin names loaded by the most recent mount() call. */
export function registerLoadedPlugins(names: readonly string[]): void {
  loadedPluginNames = names;
}

export function getLoadedPluginNames(): readonly string[] {
  return loadedPluginNames;
}
