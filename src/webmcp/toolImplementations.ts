import { getBuildState } from "../store/buildStore";
import { recordActivity } from "../domain/commands/recordActivity";
import { assessBuild } from "../domain/constraints/validateBuild";
import type { DomainAction } from "../domain/types/action";
import { componentRegistry } from "../domain/data/components";
import { installComponent } from "../domain/commands/installComponent";
import { moveComponent } from "../domain/commands/moveComponent";
import { removeComponent } from "../domain/commands/removeComponent";
import { simulateChanges } from "../domain/simulation/simulateChanges";
import { connectComponents } from "../domain/commands/connectComponents";
import { setFanDirection } from "../domain/commands/setFanDirection";
import { canUndoLastAgentAction, undoLastAgentAction } from "../domain/commands/commitDomainAction";
import { mountRegistry } from "../domain/data/mounts";
import type { BuildState } from "../domain/types/build";
import type { ToolClient } from "./types";

export interface BuildStateToolResult extends BuildState {
  canUndoLastAgentAction: boolean;
  assessment: ReturnType<typeof assessBuild>;
  components: Array<{
    id: string;
    type: string;
    installed: boolean;
    mount: string | null;
  }>;
}

export const getBuildStateTool = (): BuildStateToolResult => {
  const state = getBuildState();
  const placements = new Map(state.placements.map((placement) => [placement.componentId, placement.mountId]));
  return {
    ...state,
    canUndoLastAgentAction: canUndoLastAgentAction(),
    assessment: assessBuild(state),
    components: Object.values(componentRegistry).map((component) => ({
      id: component.id,
      type: component.type,
      installed: placements.has(component.id),
      mount: placements.get(component.id) ?? null,
    })),
  };
};

export interface ValidateBuildToolResult {
  valid: boolean;
  status: ReturnType<typeof assessBuild>["status"];
  issues: ReturnType<typeof assessBuild>["issues"];
}

export const validateBuildTool = (_input: unknown = {}, _client?: ToolClient): ValidateBuildToolResult => {
  const assessment = assessBuild(getBuildState());
  return { valid: assessment.status === "READY", ...assessment };
};

export interface MoveComponentToolInput {
  componentId: string;
  mountId: string;
}

export interface ActionToolResult {
  ok: boolean;
  placement?: { componentId: string; mountId: string };
  validation?: ValidateBuildToolResult;
  error?: { code: string; message: string };
}

const normalizeError = (error: unknown) => ({
  code: typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "COMMAND_FAILED",
  message: error instanceof Error ? error.message : "The command could not be completed.",
});

export const moveComponentTool = (input: MoveComponentToolInput): ActionToolResult => {
  try {
    const placement = moveComponent(input, { actor: "AGENT" });
    const assessment = assessBuild(getBuildState());
    recordActivity({ actor: "SYSTEM", message: `Build status is ${assessment.status}`, affectedComponentIds: [input.componentId] });
    return { ok: true, placement, validation: { valid: assessment.status === "READY", ...assessment } };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const installComponentTool = (input: { componentId: string; mountId: string }): ActionToolResult => {
  try {
    const placement = installComponent(input, { actor: "AGENT" });
    const assessment = assessBuild(getBuildState());
    return { ok: true, placement, validation: { valid: assessment.status === "READY", ...assessment } };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const simulateChangesTool = (input: { actions: DomainAction[] }): ReturnType<typeof simulateChanges> => {
  const result = simulateChanges(getBuildState(), input.actions);
  if (result.ok) {
    const last = input.actions[input.actions.length - 1];
    recordActivity({ actor: "AGENT", message: `Simulated ${last?.type ?? "build"}` });
  }
  return result;
};

export const removeComponentTool = (input: { componentId: string }): ActionToolResult => {
  try {
    removeComponent(input, { actor: "AGENT" });
    const assessment = assessBuild(getBuildState());
    return { ok: true, validation: { valid: assessment.status === "READY", ...assessment } };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const getAvailableMountsTool = (input: { componentId?: string } = {}) => {
  const occupied = new Set(getBuildState().placements.map((item) => item.mountId));
  const component = input.componentId ? componentRegistry[input.componentId] : undefined;
  if (input.componentId && !component) throw new TypeError(`Unknown component: ${input.componentId}`);
  return Object.values(mountRegistry).filter((mount) =>
    !occupied.has(mount.id) && (!component || mount.supportedComponentTypes.includes(component.type)));
};

export const connectComponentTool = (input: Parameters<typeof connectComponents>[0]): ActionToolResult => {
  try {
    connectComponents(input, { actor: "AGENT" });
    const assessment = assessBuild(getBuildState());
    return { ok: true, validation: { valid: assessment.status === "READY", ...assessment } };
  } catch (error) { return { ok: false, error: normalizeError(error) }; }
};

export const setFanDirectionTool = (input: Parameters<typeof setFanDirection>[0]): ActionToolResult => {
  try {
    setFanDirection(input, { actor: "AGENT" });
    const assessment = assessBuild(getBuildState());
    return { ok: true, validation: { valid: assessment.status === "READY", ...assessment } };
  } catch (error) { return { ok: false, error: normalizeError(error) }; }
};

export const undoLastAgentActionTool = (): ActionToolResult => {
  try {
    undoLastAgentAction();
    const assessment = assessBuild(getBuildState());
    return { ok: true, validation: { valid: assessment.status === "READY", ...assessment } };
  } catch (error) { return { ok: false, error: normalizeError(error) }; }
};

export const toolImplementations = {
  get_build_state: getBuildStateTool,
  validate_build: validateBuildTool,
  move_component: moveComponentTool,
  install_component: installComponentTool,
  remove_component: removeComponentTool,
  simulate_changes: simulateChangesTool,
  get_available_mounts: getAvailableMountsTool,
  connect_component: connectComponentTool,
  set_fan_direction: setFanDirectionTool,
  undo_last_agent_action: undoLastAgentActionTool,
};
