import { getBuildState } from "../store/buildStore";
import { recordActivity } from "../domain/commands/recordActivity";
import { validateBuild } from "../domain/constraints/validateBuild";
import type { DomainAction } from "../domain/types/action";
import { componentRegistry } from "../domain/data/components";
import { installComponent } from "../domain/commands/installComponent";
import { moveComponent } from "../domain/commands/moveComponent";
import { removeComponent } from "../domain/commands/removeComponent";
import { selectCase } from "../domain/commands/selectCase";
import { setFanDirection } from "../domain/commands/setFanDirection";
import { autoFillBuild } from "../domain/commands/autoFillBuild";
import { clearBuild } from "../domain/commands/clearBuild";
import { simulateChanges } from "../domain/simulation/simulateChanges";
import { connectComponents } from "../domain/commands/connectComponents";
import {
  canUndoLastAgentAction,
  getTopologyRevision,
  undoLastAgentAction,
} from "../domain/commands/commitDomainAction";
import { mountRegistry } from "../domain/data/mounts";
import { getActiveCaseProfile } from "../domain/cases/getActiveCase";
import type { BuildState } from "../domain/types/build";
import type { ToolClient } from "./types";

export interface BuildStateToolResult extends BuildState {
  revision: number;
  canUndoLastAgentAction: boolean;
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
    revision: getTopologyRevision(),
    canUndoLastAgentAction: canUndoLastAgentAction(),
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
  issues: ReturnType<typeof validateBuild>;
}

export const validateBuildTool = (_input: unknown = {}, _client?: ToolClient): ValidateBuildToolResult => {
  const issues = validateBuild(getBuildState());
  return { valid: issues.length === 0, issues };
};

export interface MoveComponentToolInput {
  componentId: string;
  mountId: string;
}

export interface ActionToolResult {
  ok: boolean;
  placement?: { componentId: string; mountId: string };
  result?: unknown;
  outcome?: unknown;
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
    const issues = validateBuild(getBuildState());
    return { ok: true, placement, validation: { valid: issues.length === 0, issues } };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const installComponentTool = (input: { componentId: string; mountId: string }): ActionToolResult => {
  try {
    const placement = installComponent(input, { actor: "AGENT" });
    return { ok: true, placement, validation: validateBuildTool() };
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
    return { ok: true, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

const componentFitsLimit = (
  componentId: string,
  mountId: string,
  state: BuildState,
): boolean => {
  const component = componentRegistry[componentId];
  const mount = mountRegistry[mountId];
  if (!component || !mount || !mount.supportedComponentTypes.includes(component.type)) return false;

  const profileLimit = getActiveCaseProfile(state).clearanceLimits[mountId];
  const limit = {
    maxWidth: profileLimit?.maxWidth ?? mount.constraints?.maxWidth,
    maxHeight: profileLimit?.maxHeight ?? mount.constraints?.maxHeight,
    maxDepth: profileLimit?.maxDepth ?? mount.constraints?.maxDepth,
  };
  return !(
    (limit.maxWidth !== undefined && component.dimensions.width > limit.maxWidth) ||
    (limit.maxHeight !== undefined && component.dimensions.height > limit.maxHeight) ||
    (limit.maxDepth !== undefined && component.dimensions.depth > limit.maxDepth)
  );
};

export const getAvailableMountsTool = (input: { componentId?: string } = {}) => {
  const state = getBuildState();
  const occupied = new Set(state.placements.map((placement) => placement.mountId));
  const component = input.componentId ? componentRegistry[input.componentId] : undefined;
  if (input.componentId && !component) {
    throw new TypeError(`Unknown component: ${input.componentId}`);
  }

  const profile = getActiveCaseProfile(state);
  const supportedByCase = new Set(profile.supportedMountIds);
  return Object.values(mountRegistry).filter((mount) => {
    if (occupied.has(mount.id)) return false;
    if (mount.id !== "case-root" && !supportedByCase.has(mount.id)) return false;
    return !component || componentFitsLimit(component.id, mount.id, state);
  });
};

export const connectComponentTool = (
  input: Parameters<typeof connectComponents>[0],
): ActionToolResult => {
  try {
    const result = connectComponents(input, { actor: "AGENT" });
    return { ok: true, result, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const selectCaseTool = (input: { componentId: string }): ActionToolResult => {
  try {
    const placement = selectCase(input, { actor: "AGENT" });
    return { ok: true, placement, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const setFanDirectionTool = (input: { componentId: string; direction: "INTAKE" | "EXHAUST" }) => {
  try {
    const result = setFanDirection(input, { actor: "AGENT" });
    return { ok: true, result, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const autoFillBuildTool = (_input: unknown = {}) => {
  try {
    const outcome = autoFillBuild({ actor: "AGENT" });
    return { ok: true, outcome, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const clearBuildTool = (input: { confirm: boolean }) => {
  try {
    const outcome = clearBuild({ confirm: input?.confirm }, { actor: "AGENT" });
    return { ok: true, outcome, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const undoLastAgentActionTool = (): ActionToolResult => {
  try {
    undoLastAgentAction();
    return { ok: true, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
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
  select_case: selectCaseTool,
  set_fan_direction: setFanDirectionTool,
  auto_fill_build: autoFillBuildTool,
  clear_build: clearBuildTool,
  undo_last_agent_action: undoLastAgentActionTool,
};
