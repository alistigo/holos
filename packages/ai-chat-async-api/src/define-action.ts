import type { ActionHandler, OperationSchema } from "./types.js";

export function defineApiAction<TParams extends Record<string, unknown>>(
  _name: string,
  _schema: OperationSchema | undefined,
  handler: ActionHandler<TParams>,
): ActionHandler<TParams> {
  return handler;
}
