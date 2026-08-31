import { getBuildState } from "../store/buildStore";
import { recordActivity } from "../domain/commands/recordActivity";
import { validateBuild } from "../domain/constraints/validateBuild";
import type { DomainAction } from "../domain/types/action";
import { componentRegistry } from "../domain/data/components";
import { installComponent } from "../domain/commands/installComponent";
import { moveComponent } from "../domain/commands/moveComponent";
import { removeComponent } from "../domain/commands/removeComponent";
import { simulateChanges } from "../domain/simulation/simulateChanges";
import type { BuildState } from "../domain/types/build";
import type { ToolClient } from "./types";

export interface BuildStateToolResult extends BuildState {
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
  recordActivity({ actor: "AGENT", message: "Validated build" });
  if (issues.length > 0) {
    recordActivity({ actor: "AGENT", message: `Detected ${issues[0].id}` });
  }
  return { valid: issues.length === 0, issues };
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
    const issues = validateBuild(getBuildState());
    if (issues.some((issue) => issue.id === "GPU_RADIATOR_COLLISION") === false) {
      recordActivity({ actor: "SYSTEM", message: "Validation became valid" });
    }
    return { ok: true, placement, validation: { valid: issues.length === 0, issues } };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
};

export const installComponentTool = (input: { componentId: string; mountId: string }): ActionToolResult => {
  try {
    return { ok: true, placement: installComponent(input, { actor: "AGENT" }) };
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

export const toolImplementations = {
  get_build_state: getBuildStateTool,
  validate_build: validateBuildTool,
  move_component: moveComponentTool,
  install_component: installComponentTool,
  remove_component: removeComponentTool,
  simulate_changes: simulateChangesTool,
};
