const mountedContainers: string[] = [];

export function registerMount(container: string): void {
  if (!mountedContainers.includes(container)) {
    mountedContainers.push(container);
  }
}

export function getMountedContainers(): readonly string[] {
  return mountedContainers;
}
