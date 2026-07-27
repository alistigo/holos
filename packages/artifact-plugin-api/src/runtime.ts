import type { ReactNode } from "react";
import type {
  AlistigoPlugin,
  PluginContext,
  PluginEventBus,
  PluginEventName,
  PluginHostInfo,
  PluginLogger,
} from "./types.js";

/** Creates an isolated event bus. One instance is shared by every plugin in a runtime. */
export function createPluginBus(): PluginEventBus {
  const handlers = new Map<PluginEventName, Set<(payload: unknown) => void>>();

  const on: PluginEventBus["on"] = (event, handler) => {
    let set = handlers.get(event);
    if (set === undefined) {
      set = new Set();
      handlers.set(event, set);
    }
    const wrapped = handler as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      handlers.get(event)?.delete(wrapped);
    };
  };

  const emit: PluginEventBus["emit"] = (event, payload) => {
    const set = handlers.get(event);
    if (set === undefined) return;
    for (const handler of set) {
      handler(payload);
    }
  };

  return { on, emit };
}

type LifecycleHook = "setup" | "beforeMount" | "mounted" | "destroy";

export interface PluginRuntime {
  bus: PluginEventBus;
  /** Names of every plugin this runtime was constructed with. */
  loadedPluginNames: readonly string[];
  setup(): Promise<void>;
  beforeMount(): Promise<void>;
  mounted(): Promise<void>;
  destroy(): Promise<void>;
  wrapRoot(tree: ReactNode): ReactNode;
}

/**
 * Sequences plugin lifecycle hooks in `configByPlugin` key-insertion order. Every
 * hook invocation is individually try/caught and logged — one plugin failing must
 * never break the host mount or another plugin.
 */
export function createPluginRuntime(
  plugins: readonly AlistigoPlugin[],
  host: PluginHostInfo,
  logger: PluginLogger,
  configByPlugin: Record<string, Record<string, unknown>>,
): PluginRuntime {
  const bus = createPluginBus();

  function contextFor(plugin: AlistigoPlugin): PluginContext {
    return {
      config: configByPlugin[plugin.name] ?? {},
      host,
      logger,
      on: bus.on,
      emit: bus.emit,
    };
  }

  async function runHook(hookName: LifecycleHook): Promise<void> {
    for (const plugin of plugins) {
      const hook = plugin[hookName];
      if (hook === undefined) continue;
      try {
        await hook(contextFor(plugin));
      } catch (err) {
        logger.error({ err, plugin: plugin.name, hook: hookName }, "plugin hook failed");
      }
    }
  }

  return {
    bus,
    loadedPluginNames: plugins.map((plugin) => plugin.name),
    setup: () => runHook("setup"),
    beforeMount: () => runHook("beforeMount"),
    mounted: () => runHook("mounted"),
    destroy: () => runHook("destroy"),
    wrapRoot(tree) {
      let result = tree;
      for (const plugin of plugins) {
        if (plugin.wrapRoot === undefined) continue;
        try {
          result = plugin.wrapRoot(result, contextFor(plugin));
        } catch (err) {
          logger.error({ err, plugin: plugin.name, hook: "wrapRoot" }, "plugin hook failed");
        }
      }
      return result;
    },
  };
}
