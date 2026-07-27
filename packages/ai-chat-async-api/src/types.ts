export interface OperationParamSchema {
  type: string;
  description?: string;
}

export interface OperationSchema {
  type: "object";
  properties?: Record<string, OperationParamSchema>;
  required?: string[];
}

export interface ApiOperation {
  description?: string;
  params?: OperationSchema;
}

export interface ArtifactApiDefinition {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  operations: Record<string, ApiOperation>;
}

export interface ApiCallPayload {
  action: string;
  params?: Record<string, unknown>;
}

export interface ApiCallResult {
  action: string;
  params?: Record<string, unknown>;
  status: "success" | "error";
  error?: string;
}

export type ActionHandler<TParams extends Record<string, unknown> = Record<string, unknown>> = (
  params: TParams,
) => Promise<void> | void;

export type ActionHandlers = Record<string, ActionHandler>;
