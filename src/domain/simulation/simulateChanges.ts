import { cloneBuildState } from "../activity";
import { validateBuild } from "../constraints/validateBuild";
import type { DomainAction } from "../types/action";
import type { BuildState } from "../types/build";
import { applyDomainAction } from "../commands/transition";

export interface SimulationActionResult {
  action: DomainAction;
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string };
}

export interface SimulationResult {
  ok: boolean;
  atomic: true;
  actionResults: SimulationActionResult[];
  projectedState: BuildState;
  projectedPlacements: BuildState["placements"];
  issues: ReturnType<typeof validateBuild>;
  error?: { code: string; message: string };
}

export const simulateChanges = (
  inputState: BuildState,
  actions: DomainAction[],
): SimulationResult => {
  const original = cloneBuildState(inputState);
  let projected = cloneBuildState(inputState);
  const actionResults: SimulationActionResult[] = [];

  for (const action of actions) {
    try {
      const transition = applyDomainAction(projected, action, {
        recordActivity: false,
        actor: "AGENT",
      });
      projected = transition.state;
      actionResults.push({ action, ok: true, result: transition.result });
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error("Simulation action failed");
      const code = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "SIMULATION_ACTION_FAILED";
      const failure = { code, message: normalized.message };
      actionResults.push({ action, ok: false, error: failure });
      return {
        ok: false,
        atomic: true,
        actionResults,
        projectedState: original,
        projectedPlacements: original.placements,
        issues: validateBuild(original),
        error: failure,
      };
    }
  }

  return {
    ok: true,
    atomic: true,
    actionResults,
    projectedState: projected,
    projectedPlacements: projected.placements,
    issues: validateBuild(projected),
  };
};
