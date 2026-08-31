import {
  getBuildStateTool,
  installComponentTool,
  moveComponentTool,
  removeComponentTool,
  simulateChangesTool,
  validateBuildTool,
} from "./toolImplementations";
import { createTelemetry, type WebMcpTelemetry } from "./telemetry";
import type { DocumentWithModelContext, ModelContextLike, ToolDefinition } from "./types";

export type RuntimeMode = "webmcp" | "simulation";

export interface RegistrationResult {
  mode: RuntimeMode;
  supported: boolean;
  registeredTools: string[];
  toolDefinitions: ToolDefinition[];
  telemetry: WebMcpTelemetry;
  cleanup: () => void;
}

let activeRegistration: RegistrationResult | undefined;

export const getModelContext = (): ModelContextLike | undefined => {
  if (typeof document === "undefined") return undefined;
  const candidate = (document as DocumentWithModelContext).modelContext;
  return candidate && typeof candidate.registerTool === "function" ? candidate : undefined;
};

export const getRuntimeMode = (): RuntimeMode => (getModelContext() ? "webmcp" : "simulation");

const toolDefinitions = (): ToolDefinition[] => [
  {
    name: "get_build_state",
    title: "Read current PC build state",
    description: "Read the serializable component placements, connections, fan configuration, and activity timeline.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => getBuildStateTool(),
  },
  {
    name: "validate_build",
    title: "Validate PC build",
    description: "Validate the current PC build and return every deterministic compatibility issue.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false },
    execute: async (input, client) => validateBuildTool(input, client),
  },
  {
    name: "move_component",
    title: "Move an installed component",
    description: "Move an installed component to a compatible mount and return its resulting placement and validation.",
    inputSchema: {
      type: "object",
      properties: {
        componentId: { type: "string", description: "Stable component ID, for example radiator-01." },
        mountId: { type: "string", description: "Stable compatible mount ID, for example radiator-top." },
      },
      required: ["componentId", "mountId"],
      additionalProperties: false,
    },
    execute: async (input) => moveComponentTool(input as { componentId: string; mountId: string }),
  },
  {
    name: "install_component",
    title: "Install a component",
    description: "Install a catalog component into a compatible unoccupied mount.",
    inputSchema: {
      type: "object",
      properties: { componentId: { type: "string" }, mountId: { type: "string" } },
      required: ["componentId", "mountId"],
      additionalProperties: false,
    },
    execute: async (input) => installComponentTool(input as { componentId: string; mountId: string }),
  },
  {
    name: "remove_component",
    title: "Remove a component",
    description: "Remove an installed component and its incident connections and fan configuration.",
    inputSchema: {
      type: "object",
      properties: { componentId: { type: "string" } },
      required: ["componentId"],
      additionalProperties: false,
    },
    execute: async (input) => removeComponentTool(input as { componentId: string }),
  },
  {
    name: "simulate_changes",
    title: "Simulate build changes",
    description: "Project install, move, or remove actions atomically without committing topology to the live build.",
    inputSchema: {
      type: "object",
      properties: { actions: { type: "array", description: "Domain actions to project." } },
      required: ["actions"],
      additionalProperties: false,
    },
    execute: async (input) => simulateChangesTool(input as { actions: Parameters<typeof simulateChangesTool>[0]["actions"] }),
  },
];

const waitForModelContext = async (timeoutMs: number, intervalMs: number): Promise<ModelContextLike | undefined> => {
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    const context = getModelContext();
    if (context) return context;
    if (timeoutMs === 0) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return getModelContext();
};

export const registerTools = async ({
  timeoutMs = 0,
  intervalMs = 100,
  telemetry = createTelemetry(),
}: {
  timeoutMs?: number;
  intervalMs?: number;
  telemetry?: WebMcpTelemetry;
} = {}): Promise<RegistrationResult> => {
  if (activeRegistration) {
    activeRegistration.cleanup();
    activeRegistration = undefined;
  }

  const context = await waitForModelContext(timeoutMs, intervalMs);
  const definitions = toolDefinitions();
  if (!context) {
    telemetry.mode = "simulation";
    definitions.forEach((definition) => telemetry.recordRegistration(definition.name, false, "WebMCP transport unavailable"));
    const fallback: RegistrationResult = {
      mode: "simulation",
      supported: false,
      registeredTools: [],
      toolDefinitions: definitions,
      telemetry,
      cleanup: () => undefined,
    };
    activeRegistration = fallback;
    return fallback;
  }

  const controllers: AbortController[] = [];
  const registeredTools: string[] = [];
  telemetry.mode = "webmcp";
  for (const definition of definitions) {
    const controller = new AbortController();
    try {
      await context.registerTool(definition, { signal: controller.signal });
      controllers.push(controller);
      registeredTools.push(definition.name);
      telemetry.recordRegistration(definition.name, true);
    } catch (error) {
      controller.abort();
      telemetry.recordRegistration(definition.name, false, error instanceof Error ? error.message : "Registration failed");
    }
  }

  const result: RegistrationResult = {
    mode: "webmcp",
    supported: true,
    registeredTools,
    toolDefinitions: definitions,
    telemetry,
    cleanup: () => {
      controllers.forEach((controller) => controller.abort());
      if (activeRegistration?.registeredTools === registeredTools) activeRegistration = undefined;
    },
  };
  activeRegistration = result;
  return result;
};

export const makeToolDefinitions = toolDefinitions;
