import { getBuildState } from "../store/buildStore";
import { assessBuildState } from "../domain/constraints/buildAssessment";
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
import { disconnectComponents } from "../domain/commands/disconnectComponents";
import {
  canUndoLastAgentAction,
  canRedoLastAction,
  canUndoLastAction,
  getTopologyRevision,
  undoLastAgentAction,
} from "../domain/commands/commitDomainAction";
import { mountRegistry } from "../domain/data/mounts";
import { getActiveCaseProfile } from "../domain/cases/getActiveCase";
import { caseProfiles } from "../domain/cases/caseProfiles";
import { getCompatibleMountCandidates } from "../domain/interaction/getCompatibleMounts";
import type { BuildState } from "../domain/types/build";
import type { ComponentType } from "../domain/types/component";
import type { ToolClient } from "./types";

export interface BuildStateToolResult extends BuildState {
  revision: number;
  canUndoLastAgentAction: boolean;
  canUndoLastAction: boolean;
  canRedoLastAction: boolean;
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
    canUndoLastAction: canUndoLastAction(),
    canRedoLastAction: canRedoLastAction(),
    components: Object.values(componentRegistry).map((component) => ({
      id: component.id,
      type: component.type,
      installed: placements.has(component.id),
      mount: placements.get(component.id) ?? null,
    })),
  };
};

export type ValidateBuildToolResult = ReturnType<typeof assessBuildState>;

export const validateBuildTool = (_input: unknown = {}, _client?: ToolClient): ValidateBuildToolResult => {
  return assessBuildState(getBuildState());
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
    return { ok: true, placement, validation: validateBuildTool() };
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
  return simulateChanges(getBuildState(), input.actions);
};

export const removeComponentTool = (input: { componentId: string }): ActionToolResult => {
  try {
    removeComponent(input, { actor: "AGENT" });
    return { ok: true, validation: validateBuildTool() };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
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
  if (component) {
    const currentMountId = state.placements.find(
      (placement) => placement.componentId === component.id,
    )?.mountId ?? "";
    const candidates = getCompatibleMountCandidates({
      componentId: component.id,
      currentMountId,
      state,
      caseProfile: profile,
    });
    return candidates
      .filter((candidate) => candidate.isValidSnap && candidate.mountId !== currentMountId)
      .map((candidate) => mountRegistry[candidate.mountId]);
  }
  return Object.values(mountRegistry).filter((mount) => {
    if (occupied.has(mount.id)) return false;
    if (mount.id !== "case-root" && !supportedByCase.has(mount.id)) return false;
    return true;
  });
};

export const getComponentCatalogTool = (input: { componentType?: ComponentType } = {}) => {
  return Object.values(componentRegistry)
    .filter((component) => !input.componentType || component.type === input.componentType)
    .map((component) => ({
      id: component.id,
      name: component.name,
      type: component.type,
      dimensions: { ...component.dimensions },
      power: component.power ? { ...component.power } : undefined,
      compatibility: component.compatibility ? { ...component.compatibility } : undefined,
      connectors: component.connectors?.map((connector) => ({ ...connector })) ?? [],
    }));
};

export const getCaseProfilesTool = () => {
  const state = getBuildState();
  const active = getActiveCaseProfile(state);
  return caseProfiles.map((profile) => ({
    id: profile.id,
    componentId: profile.componentId,
    label: profile.label,
    formFactor: profile.formFactor,
    active: profile.id === active.id,
    dimensionsMm: { ...profile.dimensionsMm },
    supportedMotherboardFormFactors: [...profile.supportedMotherboardFormFactors],
    mounts: profile.supportedMountIds.map((mountId) => ({
      id: mountId,
      type: mountRegistry[mountId]?.type ?? "UNKNOWN",
      supportedComponentTypes: [...(mountRegistry[mountId]?.supportedComponentTypes ?? [])],
      clearance: profile.clearanceLimits[mountId]
        ? { ...profile.clearanceLimits[mountId] }
        : mountRegistry[mountId]?.constraints
          ? { ...mountRegistry[mountId].constraints }
          : undefined,
    })),
    fanMounts: profile.fanMounts.map(({ transform: _transform, ...fanMount }) => ({ ...fanMount })),
  }));
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

export const disconnectComponentTool = (input: { connectionId: string }): ActionToolResult => {
  try {
    const result = disconnectComponents(input.connectionId, { actor: "AGENT" });
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
  get_component_catalog: getComponentCatalogTool,
  get_case_profiles: getCaseProfilesTool,
  validate_build: validateBuildTool,
  move_component: moveComponentTool,
  install_component: installComponentTool,
  remove_component: removeComponentTool,
  simulate_changes: simulateChangesTool,
  get_available_mounts: getAvailableMountsTool,
  connect_component: connectComponentTool,
  disconnect_component: disconnectComponentTool,
  select_case: selectCaseTool,
  set_fan_direction: setFanDirectionTool,
  auto_fill_build: autoFillBuildTool,
  clear_build: clearBuildTool,
  undo_last_agent_action: undoLastAgentActionTool,
};
