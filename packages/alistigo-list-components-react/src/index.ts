/**
 * @alistigo/list-components-react
 *
 * React presentational components for the Alistigo base list app. Built on
 * the repo's chosen stack (Tailwind v4 + Radix Primitives + Vaul + Motion +
 * Lucide + Radix Colors + Lingui i18n).
 *
 * Each app-shaped component conforms to the UI contract pinned down by
 * `@alistigo/features-runner-playwright` (roles + accessible names
 * + data-testids) so the Gherkin runner can drive a real app composed
 * from these primitives.
 *
 * Components are pure & presentational: they receive props and emit
 * callbacks, but do not own state, persistence, or command/event flow.
 * Wiring those concerns is the app's responsibility.
 *
 * Boot order in the consuming app (see apps/alistigo-artifact-playground):
 *   1. import "@alistigo/list-components-react/styles.css";
 *   2. await activate(LOCALE)            // load + activate Lingui catalog
 *   3. <I18nProvider i18n={i18n}> ... </I18nProvider>
 */

// app-shaped components
export { AddElementInput, type AddElementInputProps } from "./AddElementInput/index.js";
export { AlistigoApp, type AlistigoAppProps } from "./AlistigoApp/index.js";
// context (app glue)
export {
  type AlistigoActions,
  AlistigoProvider,
  type AlistigoProviderProps,
  useAlistigoActions,
  useAlistigoDocument,
} from "./context/index.js";
export { EmptyState, type EmptyStateProps } from "./EmptyState/index.js";
export { ListView, type ListViewProps } from "./ListView/index.js";
// utilities
export { cn } from "./lib/cn.js";
// shadcn-style primitives — exposed so the iframe app can compose its own UI
export { Button, type ButtonProps, buttonVariants } from "./ui/button.js";
export { Input, type InputProps } from "./ui/input.js";
