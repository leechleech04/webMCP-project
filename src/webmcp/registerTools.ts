import {
  connectComponentTool, getAvailableMountsTool, getBuildStateTool, installComponentTool,
  moveComponentTool, removeComponentTool, setFanDirectionTool, simulateChangesTool,
  undoLastAgentActionTool, validateBuildTool,
} from "./toolImplementations";
import { createTelemetry, type WebMcpTelemetry } from "./telemetry";
import type { DocumentWithModelContext, ModelContextLike, ToolDefinition } from "./types";
import type { DomainAction } from "../domain/types/action";

export type RuntimeMode = "webmcp" | "simulation" | "partial";
export interface RegistrationResult { mode: RuntimeMode; supported: boolean; registeredTools: string[]; toolDefinitions: ToolDefinition[]; telemetry: WebMcpTelemetry; cleanup: () => void; }

const stringField = (input: unknown, key: string): string => {
  if (typeof input !== "object" || input === null || typeof (input as Record<string, unknown>)[key] !== "string") throw new TypeError(`${key} must be a string`);
  return (input as Record<string, string>)[key];
};
const parseActions = (input: unknown): DomainAction[] => {
  if (typeof input !== "object" || input === null || !Array.isArray((input as { actions?: unknown }).actions) || (input as { actions: unknown[] }).actions.length === 0) throw new TypeError("actions must be a non-empty array");
  return (input as { actions: unknown[] }).actions.map((action, index) => {
    if (typeof action !== "object" || action === null || typeof (action as { type?: unknown }).type !== "string") throw new TypeError(`actions[${index}].type is required`);
    const type = (action as { type: string }).type;
    const fieldsByType: Record<string, string[]> = {
      INSTALL_COMPONENT: ["componentId", "mountId"], MOVE_COMPONENT: ["componentId", "mountId"], REMOVE_COMPONENT: ["componentId"],
      CONNECT_COMPONENTS: ["fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"], DISCONNECT_COMPONENTS: ["connectionId"], SET_FAN_DIRECTION: ["componentId", "direction"],
    };
    const fields = fieldsByType[type]; if (!fields) throw new TypeError(`actions[${index}].type is unsupported`);
    for (const field of fields) if (typeof (action as Record<string, unknown>)[field] !== "string") throw new TypeError(`actions[${index}].${field} must be a string`);
    if (type === "SET_FAN_DIRECTION" && !["INTAKE", "EXHAUST"].includes((action as { direction: string }).direction)) throw new TypeError(`actions[${index}].direction is invalid`);
    return action as DomainAction;
  });
};
const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });
const actionSchema = { oneOf: [
  { type: "object", properties: { type: { const: "INSTALL_COMPONENT" }, componentId: { type: "string" }, mountId: { type: "string" } }, required: ["type", "componentId", "mountId"], additionalProperties: false },
  { type: "object", properties: { type: { const: "MOVE_COMPONENT" }, componentId: { type: "string" }, mountId: { type: "string" } }, required: ["type", "componentId", "mountId"], additionalProperties: false },
  { type: "object", properties: { type: { const: "REMOVE_COMPONENT" }, componentId: { type: "string" } }, required: ["type", "componentId"], additionalProperties: false },
  { type: "object", properties: { type: { const: "CONNECT_COMPONENTS" }, fromComponentId: { type: "string" }, fromConnectorId: { type: "string" }, toComponentId: { type: "string" }, toConnectorId: { type: "string" } }, required: ["type", "fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"], additionalProperties: false },
  { type: "object", properties: { type: { const: "DISCONNECT_COMPONENTS" }, connectionId: { type: "string" } }, required: ["type", "connectionId"], additionalProperties: false },
  { type: "object", properties: { type: { const: "SET_FAN_DIRECTION" }, componentId: { type: "string" }, direction: { enum: ["INTAKE", "EXHAUST"] } }, required: ["type", "componentId", "direction"], additionalProperties: false },
] };
const wrap = (name: string, telemetry: WebMcpTelemetry, execute: ToolDefinition["execute"]): ToolDefinition["execute"] => async (input, client) => {
  try { const result = await execute(input, client); telemetry.recordInvocation(name, true); return result; }
  catch (error) { telemetry.recordInvocation(name, false, error instanceof Error ? error.message : "Invocation failed"); throw error; }
};

const definitionsFor = (telemetry: WebMcpTelemetry): ToolDefinition[] => {
  const definitions: ToolDefinition[] = [
    { name: "get_build_state", title: "Read current PC build state", description: "Read the authoritative topology, installation state, and undo availability.", inputSchema: objectSchema({}), annotations: { readOnlyHint: true }, execute: async () => getBuildStateTool() },
    { name: "get_available_mounts", title: "Inspect available mounts", description: "List unoccupied mounts, optionally filtered for a component.", inputSchema: objectSchema({ componentId: { type: "string" } }), annotations: { readOnlyHint: true }, execute: async (input) => getAvailableMountsTool(typeof input === "object" && input ? input as { componentId?: string } : {}) },
    { name: "validate_build", title: "Assess build readiness", description: "Return READY, INCOMPLETE, or CONFLICT with deterministic issues.", inputSchema: objectSchema({}), annotations: { readOnlyHint: true }, execute: async (input, client) => validateBuildTool(input, client) },
    { name: "install_component", title: "Install a component", description: "Install a catalog component in a compatible empty mount.", inputSchema: objectSchema({ componentId: { type: "string" }, mountId: { type: "string" } }, ["componentId", "mountId"]), execute: async (input) => installComponentTool({ componentId: stringField(input, "componentId"), mountId: stringField(input, "mountId") }) },
    { name: "move_component", title: "Move a component", description: "Move an installed component to a compatible empty mount.", inputSchema: objectSchema({ componentId: { type: "string" }, mountId: { type: "string" } }, ["componentId", "mountId"]), execute: async (input) => moveComponentTool({ componentId: stringField(input, "componentId"), mountId: stringField(input, "mountId") }) },
    { name: "remove_component", title: "Remove a component", description: "Remove a component and its connections/configuration.", inputSchema: objectSchema({ componentId: { type: "string" } }, ["componentId"]), execute: async (input) => removeComponentTool({ componentId: stringField(input, "componentId") }) },
    { name: "connect_component", title: "Connect component headers", description: "Connect a typed output to one compatible unoccupied input.", inputSchema: objectSchema({ fromComponentId: { type: "string" }, fromConnectorId: { type: "string" }, toComponentId: { type: "string" }, toConnectorId: { type: "string" } }, ["fromComponentId", "fromConnectorId", "toComponentId", "toConnectorId"]), execute: async (input) => connectComponentTool({ fromComponentId: stringField(input, "fromComponentId"), fromConnectorId: stringField(input, "fromConnectorId"), toComponentId: stringField(input, "toComponentId"), toConnectorId: stringField(input, "toConnectorId") }) },
    { name: "set_fan_direction", title: "Set fan direction", description: "Set an installed fan to intake or exhaust.", inputSchema: objectSchema({ componentId: { type: "string" }, direction: { enum: ["INTAKE", "EXHAUST"] } }, ["componentId", "direction"]), execute: async (input) => { const direction = stringField(input, "direction"); if (direction !== "INTAKE" && direction !== "EXHAUST") throw new TypeError("direction must be INTAKE or EXHAUST"); return setFanDirectionTool({ componentId: stringField(input, "componentId"), direction }); } },
    { name: "simulate_changes", title: "Simulate atomic changes", description: "Validate a typed action sequence without changing live topology.", inputSchema: objectSchema({ actions: { type: "array", minItems: 1, items: actionSchema } }, ["actions"]), execute: async (input) => simulateChangesTool({ actions: parseActions(input) }) },
    { name: "undo_last_agent_action", title: "Undo last agent action", description: "Undo the latest agent topology change only when no later change can be lost.", inputSchema: objectSchema({}), execute: async () => undoLastAgentActionTool() },
  ];
  return definitions.map((definition) => ({ ...definition, execute: wrap(definition.name, telemetry, definition.execute) }));
};

export const getModelContext = (): ModelContextLike | undefined => {
  if (typeof document === "undefined") return undefined;
  const candidate = (document as DocumentWithModelContext).modelContext;
  return candidate && typeof candidate.registerTool === "function" ? candidate : undefined;
};
export const getRuntimeMode = (): RuntimeMode => getModelContext() ? "webmcp" : "simulation";
const waitForModelContext = async (timeoutMs: number, intervalMs: number): Promise<ModelContextLike | undefined> => { const started = Date.now(); do { const context = getModelContext(); if (context) return context; if (timeoutMs === 0) break; await new Promise((resolve) => setTimeout(resolve, intervalMs)); } while (Date.now() - started <= timeoutMs); return getModelContext(); };

interface SharedRegistration { refs: number; promise: Promise<Omit<RegistrationResult, "cleanup"> & { abort: () => void }>; }
let shared: SharedRegistration | undefined;
export const registerTools = async ({ timeoutMs = 0, intervalMs = 100, telemetry = createTelemetry() }: { timeoutMs?: number; intervalMs?: number; telemetry?: WebMcpTelemetry } = {}): Promise<RegistrationResult> => {
  if (!shared) shared = { refs: 0, promise: (async () => {
    const context = await waitForModelContext(timeoutMs, intervalMs); const definitions = definitionsFor(telemetry);
    if (!context) { telemetry.mode = "simulation"; definitions.forEach((definition) => telemetry.recordRegistration(definition.name, false, "WebMCP transport unavailable")); return { mode: "simulation" as const, supported: false, registeredTools: [], toolDefinitions: definitions, telemetry, abort: () => undefined }; }
    const controllers: AbortController[] = []; const registeredTools: string[] = [];
    for (const definition of definitions) { const controller = new AbortController(); try { await context.registerTool(definition, { signal: controller.signal }); controllers.push(controller); registeredTools.push(definition.name); telemetry.recordRegistration(definition.name, true); } catch (error) { controller.abort(); telemetry.recordRegistration(definition.name, false, error instanceof Error ? error.message : "Registration failed"); } }
    const supported = registeredTools.length === definitions.length; telemetry.mode = supported ? "webmcp" : "simulation";
    return { mode: supported ? "webmcp" as const : "partial" as const, supported, registeredTools, toolDefinitions: definitions, telemetry, abort: () => controllers.forEach((controller) => controller.abort()) };
  })() };
  const lease = shared; lease.refs += 1; const base = await lease.promise; let released = false;
  if (base.mode === "simulation" && shared === lease) shared = undefined;
  return { ...base, cleanup: () => { if (released) return; released = true; lease.refs -= 1; if (lease.refs === 0) { base.abort(); if (shared === lease) shared = undefined; } } };
};
export const makeToolDefinitions = (telemetry = createTelemetry()) => definitionsFor(telemetry);
