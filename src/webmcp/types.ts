export interface ToolClient {
  signal: AbortSignal;
}

export type ToolExecute = (input: unknown, client: ToolClient) => unknown | Promise<unknown>;

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: ToolExecute;
}

export interface ModelContextLike {
  registerTool: (tool: ToolDefinition, options?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
  getTools?: (options?: Record<string, unknown>) => Promise<unknown[]>;
  unregisterTool?: (name: string) => Promise<unknown> | unknown;
}

export interface DocumentWithModelContext extends Document {
  modelContext?: ModelContextLike;
}
