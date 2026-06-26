export function resolveContainer(container: string | HTMLElement): HTMLElement | null {
  return typeof container === "string"
    ? (document.querySelector(container) as HTMLElement | null)
    : container;
}

export function resolveAutoMountTarget(container: string | undefined): HTMLElement {
  if (container !== undefined) {
    const found = document.querySelector(container);
    if (found instanceof HTMLElement) return found;
    console.error(`[Alistigo] Container "${container}" not found, appending default`);
  }
  const div = document.createElement("div");
  document.body.appendChild(div);
  return div;
}
