import { useCallback, useEffect, useRef, useState } from "react";
import { buildPlaygroundCatalog } from "../constants";
import type { Config, PlaygroundCatalog } from "../playground-config";
import {
  type ConfigLayer,
  composeConfig,
  defaultConfig,
  PLAYGROUND_STATE_KEY,
  parsePlaygroundState,
  serializePlaygroundState,
} from "../playground-state";
import { parseUrlOverrides } from "../playground-url";
import { useDocumentFixtures } from "./useDocumentFixtures";

// Re-exported so every existing importer (HostForm, HostPage, buildIframeSrcdoc)
// keeps its import path. The declarations live in playground-config.ts because
// this hook imports playground-state.ts, which types itself with Config —
// leaving them here would be an import cycle, and qa:arch-check counts
// type-only imports (tsPreCompilationDeps) and treats a cycle as an error.
export type { Config, PlaygroundMode } from "../playground-config";

/** Set VITE_DEFAULT_ARTIFACT at build time to pin a specific artifact as the landing default. */
const DEFAULT_ARTIFACT: string | undefined = import.meta.env.VITE_DEFAULT_ARTIFACT || undefined;

/** The Source field is only rendered in development, so only then is `mode` selectable. */
const MODE_SELECTABLE: boolean = import.meta.env.DEV;

/**
 * Reads the saved setup.
 *
 * Wrapped because `localStorage` is not always there to be read: a private
 * window, a browser with site data blocked, or a sandboxed context all throw on
 * access rather than returning null. A failure here must leave the playground on
 * its defaults, never blank the form (FR-005).
 */
function readStoredState(): string | null {
  try {
    return localStorage.getItem(PLAYGROUND_STATE_KEY);
  } catch {
    return null;
  }
}

/**
 * Writes the saved setup, or quietly does nothing.
 *
 * A throw here means "this browser will not remember your setup", which is a
 * degraded mode, not an error the developer can act on — and it must not
 * interrupt typing. Deliberately silent: `console` is not available to app code
 * (constitution, Observability), and in a private window this is the expected
 * path rather than a fault.
 */
function writeStoredState(config: Config): void {
  try {
    localStorage.setItem(PLAYGROUND_STATE_KEY, serializePlaygroundState(config));
  } catch {
    /* no persistence available — the playground stays fully usable without it */
  }
}

/** The address, or nothing when there is no `window` (Storybook test runs, SSR). */
function currentSearch(): string {
  try {
    return window.location.search;
  } catch {
    return "";
  }
}

/**
 * Computes the setup the playground opens with: defaults ◁ saved ◁ address.
 *
 * Done as the `useState` initialiser rather than in an effect, so the very first
 * render already holds the final configuration. An effect-based restore would
 * boot the preview iframe twice — once on defaults, once on the restored setup —
 * which flashes on every page open and leaves a window in which the form and the
 * iframe disagree about which artifact is loaded.
 *
 * The address is read here and nowhere else. With no effect watching
 * `location.search`, nothing can re-apply a parameter and fight the developer's
 * next selection (FR-011); an applied override is from then on indistinguishable
 * from a manual choice, and the persist effect saves it like any other.
 */
function initialConfig(catalog: PlaygroundCatalog, overrides: ConfigLayer): Config {
  return composeConfig(
    defaultConfig(catalog, DEFAULT_ARTIFACT),
    parsePlaygroundState(readStoredState(), catalog),
    parseUrlOverrides(currentSearch(), catalog),
    overrides,
  );
}

export interface UseHostConfigResult {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  /**
   * Re-writes the saved setup from the current config.
   *
   * Needed because Clear Data reaches this key: the preview iframe is a srcdoc
   * with `allow-same-origin`, so clearing "the artifact's" storage clears the
   * whole origin, this entry included — while `config` is untouched, so the
   * persist effect below never fires and the setup would silently be gone at the
   * next page load (FR-022).
   */
  rewritePersisted: () => void;
}

export function useHostConfig(overrides: ConfigLayer = {}): UseHostConfigResult {
  const documentNames = useDocumentFixtures();

  // The catalogue is rebuilt per render but never identity-compared; the fixture
  // list is static (import.meta.glob, eager) and the registry does not change at
  // runtime, so this is a plain derivation rather than state.
  const catalog = buildPlaygroundCatalog(documentNames, MODE_SELECTABLE);
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;

  // Computed once, at mount — see initialConfig for why that matters.
  const [config, setConfig] = useState<Config>(() => initialConfig(catalog, overrides));

  useEffect(() => {
    writeStoredState(config);
  }, [config]);

  const rewritePersisted = useCallback(() => {
    writeStoredState(config);
  }, [config]);

  return { config, setConfig, rewritePersisted };
}
