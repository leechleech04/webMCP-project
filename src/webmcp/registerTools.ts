import type { DomainAction } from "../domain/types/action";
import {
  autoFillBuildTool,
  clearBuildTool,
  connectComponentTool,
  disconnectComponentTool,
  getAvailableMountsTool,
  getBuildStateTool,
  getCaseProfilesTool,
  getComponentCatalogTool,
  installComponentTool,
  moveComponentTool,
  removeComponentTool,
  selectCaseTool,
  setFanDirectionTool,
  simulateChangesTool,
  undoLastAgentActionTool,
  validateBuildTool,
} from "./toolImplementations";
import { createTelemetry, type WebMcpTelemetry } from "./telemetry";
import type { DocumentWithModelContext, ModelContextLike, ToolDefinition } from "./types";

export type RuntimeMode = "webmcp" | "simulation" | "partial";

export interface RegistrationResult {
  mode: RuntimeMode;
  supported: boolean;
  registeredTools: string[];
  toolDefinitions: ToolDefinition[];
  telemetry: WebMcpTelemetry;
  cleanup: () => void;
}

type InputRecord = Record<string, unknown>;

const strictObject = (
  input: unknown,
  toolName: string,
  allowedKeys: readonly string[],
): InputRecord => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError(`${toolName} input must be an object`);
  }
  const value = input as InputRecord;
  const unknownKey = Object.keys(value).find((key) => !allowedKeys.includes(key));
  if (unknownKey) throw new TypeError(`${toolName} input contains unknown property: ${unknownKey}`);
  return value;
};

const requiredString = (input: InputRecord, key: string): string => {
  const value = input[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${key} must be a non-empty string`);
  }
  return value;
};

const optionalString = (input: InputRecord, key: string): string | undefined => {
  if (!(key in input)) return undefined;
  return requiredString(input, key);
};

const componentTypes = [
  "CASE", "MOTHERBOARD", "CPU", "GPU", "RAM", "STORAGE", "CPU_COOLER", "RADIATOR", "FAN", "PSU",
] as const;

const optionalComponentType = (input: InputRecord, key: string): (typeof componentTypes)[number] | undefined => {
  const value = optionalString(input, key);
  if (value === undefined) return undefined;
  if (!componentTypes.includes(value as (typeof componentTypes)[number])) {
    throw new TypeError(`${key} must be a supported component type`);
  }
  return value as (typeof componentTypes)[number];
};

const requiredBoolean = (input: InputRecord, key: string): boolean => {
  const value = input[key];
  if (typeof value !== "boolean") throw new TypeError(`${key} must be a boolean`);
  return value;
};

const actionFields: Record<DomainAction["type"], readonly string[]> = {
  INSTALL_COMPONENT: ["type", "componentId", "mountId"],
  MOVE_COMPONENT: ["type", "componentId", "mountId"],
  REMOVE_COMPONENT: ["type", "componentId"],
  CONNECT_COMPONENTS: ["type", "fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"],
  DISCONNECT_COMPONENTS: ["type", "connectionId"],
  SET_FAN_DIRECTION: ["type", "componentId", "direction"],
  SELECT_CASE: ["type", "componentId"],
  AUTO_FILL_BUILD: ["type"],
  CLEAR_BUILD: ["type", "confirm"],
};

const parseAction = (value: unknown, index: number): DomainAction => {
  const prefix = `actions[${index}]`;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${prefix} must be an object`);
  }
  const candidate = value as InputRecord;
  const type = requiredString(candidate, "type") as DomainAction["type"];
  const allowed = actionFields[type];
  if (!allowed) throw new TypeError(`${prefix}.type is unsupported`);
  const input = strictObject(candidate, prefix, allowed);

  switch (type) {
    case "INSTALL_COMPONENT":
    case "MOVE_COMPONENT":
      return { type, componentId: requiredString(input, "componentId"), mountId: requiredString(input, "mountId") };
    case "REMOVE_COMPONENT":
    case "SELECT_CASE":
      return { type, componentId: requiredString(input, "componentId") };
    case "CONNECT_COMPONENTS":
      return {
        type,
        fromComponentId: requiredString(input, "fromComponentId"),
        fromConnectorId: requiredString(input, "fromConnectorId"),
        toComponentId: requiredString(input, "toComponentId"),
        toConnectorId: requiredString(input, "toConnectorId"),
      };
    case "DISCONNECT_COMPONENTS":
      return { type, connectionId: requiredString(input, "connectionId") };
    case "SET_FAN_DIRECTION": {
      const direction = requiredString(input, "direction");
      if (direction !== "INTAKE" && direction !== "EXHAUST") {
        throw new TypeError(`${prefix}.direction must be INTAKE or EXHAUST`);
      }
      return { type, componentId: requiredString(input, "componentId"), direction };
    }
    case "AUTO_FILL_BUILD":
      return { type };
    case "CLEAR_BUILD":
      return { type, confirm: requiredBoolean(input, "confirm") };
  }
};

const parseActions = (input: unknown): DomainAction[] => {
  const value = strictObject(input, "simulate_changes", ["actions"]);
  if (!Array.isArray(value.actions) || value.actions.length === 0) {
    throw new TypeError("actions must be a non-empty array");
  }
  return value.actions.map(parseAction);
};

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const actionSchema = {
  oneOf: [
    objectSchema({ type: { const: "INSTALL_COMPONENT" }, componentId: { type: "string", minLength: 1 }, mountId: { type: "string", minLength: 1 } }, ["type", "componentId", "mountId"]),
    objectSchema({ type: { const: "MOVE_COMPONENT" }, componentId: { type: "string", minLength: 1 }, mountId: { type: "string", minLength: 1 } }, ["type", "componentId", "mountId"]),
    objectSchema({ type: { const: "REMOVE_COMPONENT" }, componentId: { type: "string", minLength: 1 } }, ["type", "componentId"]),
    objectSchema({ type: { const: "CONNECT_COMPONENTS" }, fromComponentId: { type: "string", minLength: 1 }, fromConnectorId: { type: "string", minLength: 1 }, toComponentId: { type: "string", minLength: 1 }, toConnectorId: { type: "string", minLength: 1 } }, ["type", "fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"]),
    objectSchema({ type: { const: "DISCONNECT_COMPONENTS" }, connectionId: { type: "string", minLength: 1 } }, ["type", "connectionId"]),
    objectSchema({ type: { const: "SET_FAN_DIRECTION" }, componentId: { type: "string", minLength: 1 }, direction: { enum: ["INTAKE", "EXHAUST"] } }, ["type", "componentId", "direction"]),
    objectSchema({ type: { const: "SELECT_CASE" }, componentId: { type: "string", minLength: 1 } }, ["type", "componentId"]),
    objectSchema({ type: { const: "AUTO_FILL_BUILD" } }, ["type"]),
    objectSchema({ type: { const: "CLEAR_BUILD" }, confirm: { type: "boolean" } }, ["type", "confirm"]),
  ],
};

const returnedError = (result: unknown): string | undefined => {
  if (typeof result !== "object" || result === null || !("ok" in result) || (result as { ok: unknown }).ok !== false) {
    return undefined;
  }
  const error = (result as { error?: unknown }).error;
  if (typeof error === "object" && error !== null && "message" in error) return String((error as { message: unknown }).message);
  return "Tool returned an error result";
};

const withInvocationTelemetry = (
  name: string,
  telemetry: WebMcpTelemetry,
  execute: ToolDefinition["execute"],
): ToolDefinition["execute"] => async (input, client) => {
  try {
    const result = await execute(input, client);
    const error = returnedError(result);
    telemetry.recordInvocation(name, error === undefined, error);
    return result;
  } catch (error) {
    telemetry.recordInvocation(name, false, error instanceof Error ? error.message : "Invocation failed");
    throw error;
  }
};

const definitionsFor = (telemetry: WebMcpTelemetry): ToolDefinition[] => {
  const definitions: ToolDefinition[] = [
    {
      name: "get_build_state",
      title: "Read current PC build state",
      description: "Read the authoritative placements, connections, fan configuration, activity, and agent undo availability.",
      inputSchema: objectSchema({}),
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        strictObject(input, "get_build_state", []);
        return getBuildStateTool();
      },
    },
    {
      name: "get_component_catalog",
      title: "Inspect component catalog",
      description: "Discover component IDs, names, dimensions, power, compatibility, and connector IDs/types/directions, optionally filtered by component type.",
      inputSchema: objectSchema({ componentType: { enum: componentTypes } }),
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const value = strictObject(input, "get_component_catalog", ["componentType"]);
        return getComponentCatalogTool({ componentType: optionalComponentType(value, "componentType") });
      },
    },
    {
      name: "get_case_profiles",
      title: "Inspect case profiles",
      description: "Discover available case IDs, dimensions, motherboard support, mounts, clearances, and recommended fan metadata.",
      inputSchema: objectSchema({}),
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        strictObject(input, "get_case_profiles", []);
        return getCaseProfilesTool();
      },
    },
    {
      name: "get_available_mounts",
      title: "Inspect available mounts",
      description: "List unoccupied mounts supported by the active case, optionally filtered for one catalog component.",
      inputSchema: objectSchema({ componentId: { type: "string", minLength: 1 } }),
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const value = strictObject(input, "get_available_mounts", ["componentId"]);
        return getAvailableMountsTool({ componentId: optionalString(value, "componentId") });
      },
    },
    {
      name: "validate_build",
      title: "Validate PC build",
      description: "Assess readiness as READY, INCOMPLETE, or CONFLICT, including compatibility issues, missing essential components, and missing PSU power connections without changing state.",
      inputSchema: objectSchema({}),
      annotations: { readOnlyHint: true },
      execute: async (input, client) => {
        strictObject(input, "validate_build", []);
        return validateBuildTool(input, client);
      },
    },
    {
      name: "install_component",
      title: "Install a component",
      description: "Install a catalog component into a compatible unoccupied mount.",
      inputSchema: objectSchema({ componentId: { type: "string", minLength: 1 }, mountId: { type: "string", minLength: 1 } }, ["componentId", "mountId"]),
      execute: async (input) => {
        const value = strictObject(input, "install_component", ["componentId", "mountId"]);
        return installComponentTool({ componentId: requiredString(value, "componentId"), mountId: requiredString(value, "mountId") });
      },
    },
    {
      name: "move_component",
      title: "Move an installed component",
      description: "Move an installed component to a compatible unoccupied mount.",
      inputSchema: objectSchema({ componentId: { type: "string", minLength: 1 }, mountId: { type: "string", minLength: 1 } }, ["componentId", "mountId"]),
      execute: async (input) => {
        const value = strictObject(input, "move_component", ["componentId", "mountId"]);
        return moveComponentTool({ componentId: requiredString(value, "componentId"), mountId: requiredString(value, "mountId") });
      },
    },
    {
      name: "remove_component",
      title: "Remove a component",
      description: "Remove an installed component and its incident connections and fan configuration.",
      inputSchema: objectSchema({ componentId: { type: "string", minLength: 1 } }, ["componentId"]),
      execute: async (input) => {
        const value = strictObject(input, "remove_component", ["componentId"]);
        return removeComponentTool({ componentId: requiredString(value, "componentId") });
      },
    },
    {
      name: "connect_component",
      title: "Connect component headers",
      description: "Connect a typed output connector to one compatible input connector.",
      inputSchema: objectSchema({ fromComponentId: { type: "string", minLength: 1 }, fromConnectorId: { type: "string", minLength: 1 }, toComponentId: { type: "string", minLength: 1 }, toConnectorId: { type: "string", minLength: 1 } }, ["fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"]),
      execute: async (input) => {
        const value = strictObject(input, "connect_component", ["fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"]);
        return connectComponentTool({
          fromComponentId: requiredString(value, "fromComponentId"),
          fromConnectorId: requiredString(value, "fromConnectorId"),
          toComponentId: requiredString(value, "toComponentId"),
          toConnectorId: requiredString(value, "toConnectorId"),
        });
      },
    },
    {
      name: "disconnect_component",
      title: "Disconnect component headers",
      description: "Remove one existing cable by the connection ID returned by get_build_state.",
      inputSchema: objectSchema({ connectionId: { type: "string", minLength: 1 } }, ["connectionId"]),
      execute: async (input) => {
        const value = strictObject(input, "disconnect_component", ["connectionId"]);
        return disconnectComponentTool({ connectionId: requiredString(value, "connectionId") });
      },
    },
    {
      name: "set_fan_direction",
      title: "Set fan airflow direction",
      description: "Set an installed fan to intake or exhaust.",
      inputSchema: objectSchema({ componentId: { type: "string", minLength: 1 }, direction: { enum: ["INTAKE", "EXHAUST"] } }, ["componentId", "direction"]),
      execute: async (input) => {
        const value = strictObject(input, "set_fan_direction", ["componentId", "direction"]);
        const direction = requiredString(value, "direction");
        if (direction !== "INTAKE" && direction !== "EXHAUST") throw new TypeError("direction must be INTAKE or EXHAUST");
        return setFanDirectionTool({ componentId: requiredString(value, "componentId"), direction });
      },
    },
    {
      name: "simulate_changes",
      title: "Simulate atomic build changes",
      description: "Project a strictly typed action sequence without committing topology to the live build.",
      inputSchema: objectSchema({ actions: { type: "array", minItems: 1, items: actionSchema } }, ["actions"]),
      execute: async (input) => simulateChangesTool({ actions: parseActions(input) }),
    },
    {
      name: "select_case",
      title: "Select case profile",
      description: "Change the active PC case form factor through the shared domain command path.",
      inputSchema: objectSchema({ componentId: { type: "string", minLength: 1 } }, ["componentId"]),
      execute: async (input) => {
        const value = strictObject(input, "select_case", ["componentId"]);
        return selectCaseTool({ componentId: requiredString(value, "componentId") });
      },
    },
    {
      name: "auto_fill_build",
      title: "Auto fill build",
      description: "Deterministically fill compatible empty mounts for the active case profile.",
      inputSchema: objectSchema({}),
      execute: async (input) => {
        strictObject(input, "auto_fill_build", []);
        return autoFillBuildTool();
      },
    },
    {
      name: "clear_build",
      title: "Clear build",
      description: "Remove all non-case components after explicit confirmation while preserving the selected case.",
      inputSchema: objectSchema({ confirm: { type: "boolean" } }, ["confirm"]),
      execute: async (input) => {
        const value = strictObject(input, "clear_build", ["confirm"]);
        return clearBuildTool({ confirm: requiredBoolean(value, "confirm") });
      },
    },
    {
      name: "undo_last_agent_action",
      title: "Undo last agent action",
      description: "Undo the latest agent topology change only when no later state change can be lost.",
      inputSchema: objectSchema({}),
      execute: async (input) => {
        strictObject(input, "undo_last_agent_action", []);
        return undoLastAgentActionTool();
      },
    },
  ];

  return definitions.map((definition) => ({
    ...definition,
    execute: withInvocationTelemetry(definition.name, telemetry, definition.execute),
  }));
};

export const getModelContext = (): ModelContextLike | undefined => {
  if (typeof document === "undefined") return undefined;
  const candidate = (document as DocumentWithModelContext).modelContext;
  return candidate && typeof candidate.registerTool === "function" ? candidate : undefined;
};

export const getRuntimeMode = (): RuntimeMode => (getModelContext() ? "webmcp" : "simulation");

const waitForModelContext = async (
  timeoutMs: number,
  intervalMs: number,
): Promise<ModelContextLike | undefined> => {
  const started = Date.now();
  do {
    const context = getModelContext();
    if (context) return context;
    if (timeoutMs === 0) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (Date.now() - started <= timeoutMs);
  return getModelContext();
};

export const executeWebMcpTool = async (
  name: string,
  input: unknown,
  telemetry: WebMcpTelemetry = createTelemetry(),
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> => {
  const definition = definitionsFor(telemetry).find((item) => item.name === name);
  if (!definition) {
    telemetry.recordInvocation(name, false, `Unknown tool: ${name}`);
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }

  try {
    const result = await definition.execute(input, { signal: new AbortController().signal });
    const error = returnedError(result);
    if (error) {
      const detail = (result as { error?: { code?: unknown; message?: unknown } }).error;
      return {
        isError: true,
        content: [{ type: "text", text: `Error [${String(detail?.code ?? "ERROR")}]: ${String(detail?.message ?? error)}` }],
      };
    }
    const summary = name === "auto_fill_build"
      ? "Auto-fill build completed successfully."
      : name === "clear_build"
        ? "Build cleared successfully."
        : `Executed tool ${name}`;
    return { content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(result, null, 2)}` }] };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}` }],
    };
  }
};

interface SharedRegistration {
  refs: number;
  promise: Promise<Omit<RegistrationResult, "cleanup"> & { abort: () => void }>;
}

let sharedRegistration: SharedRegistration | undefined;

export const registerTools = async ({
  timeoutMs = 0,
  intervalMs = 100,
  telemetry = createTelemetry(),
}: {
  timeoutMs?: number;
  intervalMs?: number;
  telemetry?: WebMcpTelemetry;
} = {}): Promise<RegistrationResult> => {
  if (!sharedRegistration) {
    sharedRegistration = {
      refs: 0,
      promise: (async () => {
        const context = await waitForModelContext(timeoutMs, intervalMs);
        const definitions = definitionsFor(telemetry);
        if (!context) {
          telemetry.mode = "simulation";
          definitions.forEach((definition) => {
            telemetry.recordRegistration(definition.name, false, "WebMCP transport unavailable");
          });
          return {
            mode: "simulation" as const,
            supported: false,
            registeredTools: [],
            toolDefinitions: definitions,
            telemetry,
            abort: () => undefined,
          };
        }

        const controllers: AbortController[] = [];
        const registeredTools: string[] = [];
        for (const definition of definitions) {
          const controller = new AbortController();
          try {
            await context.registerTool(definition, { signal: controller.signal });
            controllers.push(controller);
            registeredTools.push(definition.name);
            telemetry.recordRegistration(definition.name, true);
          } catch (error) {
            controller.abort();
            telemetry.recordRegistration(
              definition.name,
              false,
              error instanceof Error ? error.message : "Registration failed",
            );
          }
        }

        const supported = registeredTools.length === definitions.length;
        const mode: RuntimeMode = supported ? "webmcp" : "partial";
        telemetry.mode = mode;
        return {
          mode,
          supported,
          registeredTools,
          toolDefinitions: definitions,
          telemetry,
          abort: () => controllers.forEach((controller) => controller.abort()),
        };
      })(),
    };
  }

  const lease = sharedRegistration;
  lease.refs += 1;
  const base = await lease.promise;
  let released = false;

  if (base.mode === "simulation" && sharedRegistration === lease) {
    sharedRegistration = undefined;
  }

  return {
    ...base,
    cleanup: () => {
      if (released) return;
      released = true;
      lease.refs -= 1;
      if (lease.refs === 0) {
        base.abort();
        if (sharedRegistration === lease) sharedRegistration = undefined;
      }
    },
  };
};

export const makeToolDefinitions = (telemetry = createTelemetry()): ToolDefinition[] => definitionsFor(telemetry);
