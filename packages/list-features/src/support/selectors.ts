/**
 * The DOM/ARIA contract the Alistigo app must honor for these tests to
 * operate. Single source of truth for what the runner expects in the
 * rendered page.
 *
 * Locators are accessibility-first: roles + accessible names where the
 * native HTML element provides semantics (textbox, list, listitem, button),
 * with `data-testid` only where ARIA can't disambiguate (the app root
 * sanity check and the empty-state message).
 */

export const ROLES = {
  addInput: { role: "textbox", name: "Add element" },
  addSubmit: { role: "button", name: "Add" },
  list: { role: "list" },
  row: { role: "listitem" },
  rowDelete: { role: "button", namePrefix: "Delete" },
  rowCheckbox: { role: "checkbox", name: "Mark as done" },
  userMenu: { role: "button", name: "User menu" },
  editUser: { role: "button", name: "Edit user" },
  pseudoInput: { role: "textbox", name: "Pseudo" },
} as const;

/**
 * List-domain test ids only. The platform-wide markers — the `alistigo-app`
 * readiness root and the `action-pending` busy flag — now live in
 * `PLATFORM_TEST_IDS` in the runner's harness, because every artifact exposes
 * them and the harness waits on them without domain knowledge.
 */
export const TEST_IDS = {
  emptyState: "empty-state",
  badge: "alistigo-badge",
  userPseudo: "user-pseudo",
} as const;

export function deleteButtonName(elementText: string): string {
  return `Delete "${elementText}"`;
}
