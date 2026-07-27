import type {
  ActionHandlers,
  ApiCallPayload,
  ApiCallResult,
  ArtifactApiDefinition,
} from "./types.js";

export class ApiCallsExecutor {
  readonly #definition: ArtifactApiDefinition;
  readonly #handlers: ActionHandlers;

  constructor(definition: ArtifactApiDefinition, handlers: ActionHandlers) {
    this.#definition = definition;
    this.#handlers = handlers;
  }

  async execute(): Promise<void> {
    const el = document.querySelector("api-calls");
    if (el === null) return;

    let calls: ApiCallPayload[] = [];
    try {
      calls = JSON.parse(el.textContent ?? "[]") as ApiCallPayload[];
    } catch {
      el.remove();
      window.parent.postMessage({ type: "alistigo:api-calls-result", calls: [] });
      return;
    }

    el.remove();

    const results: ApiCallResult[] = [];
    for (const call of calls) {
      const handler = this.#handlers[call.action];
      if (handler === undefined) {
        results.push({
          action: call.action,
          ...(call.params !== undefined && { params: call.params }),
          status: "error",
          error: `Unknown action: ${call.action}`,
        });
        continue;
      }
      try {
        await handler(call.params ?? {});
        results.push({
          action: call.action,
          ...(call.params !== undefined && { params: call.params }),
          status: "success",
        });
      } catch (err) {
        results.push({
          action: call.action,
          ...(call.params !== undefined && { params: call.params }),
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    window.parent.postMessage({ type: "alistigo:api-calls-result", calls: results });
  }

  get definition(): ArtifactApiDefinition {
    return this.#definition;
  }
}
