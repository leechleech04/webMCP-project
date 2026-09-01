import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { installComponent } from "../domain/commands/installComponent";
import { moveComponent } from "../domain/commands/moveComponent";
import { removeComponent } from "../domain/commands/removeComponent";
import { componentRegistry } from "../domain/data/components";
import { mountRegistry } from "../domain/data/mounts";
import { ActivityPanel } from "../components/build/ActivityPanel";
import { ReviewerSimulationPanel } from "../components/build/ReviewerSimulationPanel";
import { ValidationPanel } from "../components/build/ValidationPanel";
import { ComponentPalette } from "../components/build/ComponentPalette";
import { BuildTree } from "../components/build/BuildTree";
import { useBuildStore } from "../store/buildStore";
import { getRuntimeMode, registerTools, type RuntimeMode } from "../webmcp/registerTools";

const PcScene = lazy(() => import("../components/scene/PcScene").then((module) => ({ default: module.PcScene })));

const GPU_ID = "gpu-01";
const GPU_MOUNT_ID = "pcie-slot-1";
const RADIATOR_ID = "radiator-01";
const RADIATOR_FRONT_MOUNT_ID = "radiator-front";
const RADIATOR_TOP_MOUNT_ID = "radiator-top";

const formatMountLabel = (mountId: string): string => mountId.replaceAll("-", " ").toUpperCase();
const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : "The command could not be completed.";

export function App() {
  const placements = useBuildStore((state) => state.placements);
  const activity = useBuildStore((state) => state.activity);
  const [validationHighlightIds, setValidationHighlightIds] = useState<string[]>([]);
  const [agentHighlightIds, setAgentHighlightIds] = useState<string[]>([]);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>(() => getRuntimeMode());
  const [commandMessage, setCommandMessage] = useState("Run a domain command to change the shared Build State.");
  const [registeredToolCount, setRegisteredToolCount] = useState(0);
  const highlightedComponentIds = useMemo(() => [...new Set([...validationHighlightIds, ...agentHighlightIds])], [validationHighlightIds, agentHighlightIds]);

  useEffect(() => {
    let alive = true;
    let cleanup: () => void = () => undefined;
    void registerTools().then((registration) => {
      if (alive) {
        setRuntimeMode(registration.mode);
        setRegisteredToolCount(registration.registeredTools.length);
        cleanup = registration.cleanup;
      } else {
        registration.cleanup();
      }
    });
    return () => {
      alive = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const latest = activity.at(-1);
    if (latest?.actor !== "AGENT" || !latest.affectedComponentIds?.length) return;
    setAgentHighlightIds(latest.affectedComponentIds);
    const timer = window.setTimeout(() => setAgentHighlightIds([]), 2500);
    return () => window.clearTimeout(timer);
  }, [activity]);

  const gpu = componentRegistry[GPU_ID];
  const radiator = componentRegistry[RADIATOR_ID];
  const gpuPlacement = placements.find((placement) => placement.componentId === GPU_ID);
  const radiatorPlacement = placements.find((placement) => placement.componentId === RADIATOR_ID);
  const gpuMount = gpuPlacement ? mountRegistry[gpuPlacement.mountId] : undefined;

  const runCommand = (command: () => void, successMessage: string) => {
    try {
      command();
      setCommandMessage(successMessage);
    } catch (error) {
      setCommandMessage(getErrorMessage(error));
    }
  };

  const debugOutput = [
    `GPU: ${gpuPlacement ? "Installed" : "Not installed"}`,
    `GPU Mount: ${gpuMount ? formatMountLabel(gpuMount.id) : "NONE"}`,
    `Radiator: ${radiatorPlacement ? "Installed" : "Not installed"}`,
    `Radiator Mount: ${radiatorPlacement ? formatMountLabel(radiatorPlacement.mountId) : "NONE"}`,
  ].join("\n");

  return (
    <main className="workspace-shell">
      <section className="debug-card" aria-labelledby="debug-title">
        <div className="eyebrow">AI PC Assembly Workspace</div>
        <div className="title-row">
          <div>
            <h1 id="debug-title">Build State Studio</h1>
            <p>One deterministic topology drives the GUI, the 3D scene, and WebMCP tools.</p>
          </div>
          <span className={`status-badge runtime-${runtimeMode}`}>{runtimeMode === "webmcp" ? `WebMCP live · ${registeredToolCount}/10 tools` : runtimeMode === "partial" ? `WebMCP partial · ${registeredToolCount}/10` : "Reviewer simulation"}</span>
        </div>

        <div className="scene-layout">
          <div className="scene-card">
            <Suspense fallback={<div className="scene-loading">Loading 3D workspace…</div>}><PcScene highlightedComponentIds={highlightedComponentIds} /></Suspense>
            <div className="scene-overlay" aria-hidden="true">
              <span>LIVE BUILD STATE</span>
              <strong>{gpuPlacement ? "GPU installed" : "GPU not installed"}</strong>
              <strong>{radiatorPlacement ? `Radiator · ${formatMountLabel(radiatorPlacement.mountId)}` : "Radiator not installed"}</strong>
              {highlightedComponentIds.length > 0 && <em>Issue or agent change · affected models highlighted</em>}
            </div>
          </div>

          <aside className="controls-panel" aria-label="Build controls">
            <div className="component-control">
              <div className="component-summary">
                <div className="component-icon" aria-hidden="true">GPU</div>
                <div><strong>{gpu.name}</strong><span>{gpu.dimensions.depth} mm · {gpu.power?.consumption} W</span></div>
                <span className={gpuPlacement ? "install-state installed" : "install-state"}>{gpuPlacement ? "Installed" : "Available"}</span>
              </div>
              <div className="command-row">
                <button type="button" onClick={() => runCommand(() => installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID }), "GPU installed at PCIE_SLOT_1.")} disabled={!!gpuPlacement}>Install GPU</button>
                <button type="button" className="secondary" onClick={() => runCommand(() => removeComponent({ componentId: GPU_ID }), "GPU removed from the build.")} disabled={!gpuPlacement}>Remove GPU</button>
              </div>
            </div>

            <div className="component-control">
              <div className="component-summary">
                <div className="component-icon radiator" aria-hidden="true">RAD</div>
                <div><strong>{radiator.name}</strong><span>{radiator.dimensions.depth} mm · Front / Top</span></div>
                <span className={radiatorPlacement ? "install-state installed" : "install-state"}>{radiatorPlacement ? formatMountLabel(radiatorPlacement.mountId) : "Available"}</span>
              </div>
              <div className="command-row radiator-commands">
                <button type="button" onClick={() => runCommand(() => installComponent({ componentId: RADIATOR_ID, mountId: RADIATOR_FRONT_MOUNT_ID }), "Radiator installed at RADIATOR_FRONT.")} disabled={!!radiatorPlacement}>Install Front</button>
                <button type="button" className="secondary" onClick={() => runCommand(() => moveComponent({ componentId: RADIATOR_ID, mountId: RADIATOR_TOP_MOUNT_ID }), "Radiator moved to RADIATOR_TOP.")} disabled={!radiatorPlacement || radiatorPlacement.mountId === RADIATOR_TOP_MOUNT_ID}>Move Top</button>
                <button type="button" className="secondary" onClick={() => runCommand(() => moveComponent({ componentId: RADIATOR_ID, mountId: RADIATOR_FRONT_MOUNT_ID }), "Radiator moved to RADIATOR_FRONT.")} disabled={!radiatorPlacement || radiatorPlacement.mountId === RADIATOR_FRONT_MOUNT_ID}>Move Front</button>
                <button type="button" className="secondary" onClick={() => runCommand(() => removeComponent({ componentId: RADIATOR_ID }), "Radiator removed from the build.")} disabled={!radiatorPlacement}>Remove</button>
              </div>
            </div>

            <p className="command-message" role="status">{commandMessage}</p>
            <div className="scene-hint">Drag to orbit · Scroll to zoom · Select a validation card to highlight models</div>
          </aside>
        </div>

        <div className="workspace-grid"><ComponentPalette onMessage={setCommandMessage} /><BuildTree onMessage={setCommandMessage} /></div>

        <section className="agent-guide" aria-labelledby="agent-guide-title">
          <div><div className="eyebrow">Thoughtful WebMCP workflow</div><h2 id="agent-guide-title">Ask your browser agent in natural language</h2><p>“Check this build, simulate a safe fix, then apply it.” The agent can inspect → validate → simulate → apply, while every committed change stays visible and undoable.</p></div>
          <ol><li><strong>Inspect</strong><span>Read state and available mounts</span></li><li><strong>Explain</strong><span>Separate incomplete work from conflicts</span></li><li><strong>Simulate</strong><span>Project typed actions atomically</span></li><li><strong>Apply</strong><span>Commit, highlight, audit, or undo</span></li></ol>
        </section>

        <div className="insight-grid">
          <ValidationPanel onSelectionChange={setValidationHighlightIds} />
          <ActivityPanel />
        </div>

        {runtimeMode === "simulation" && <ReviewerSimulationPanel />}

        <details className="debug-details"><summary>Developer state inspection</summary><div className="debug-grid">
          <div><h2>Human-readable state</h2><pre>{debugOutput}</pre></div>
          <div><h2>Zustand placements</h2><pre>{JSON.stringify({ placements }, null, 2)}</pre></div>
        </div></details>
      </section>
    </main>
  );
}
