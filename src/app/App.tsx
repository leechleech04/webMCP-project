import { lazy, Suspense, useEffect, useState } from "react";
import { ActivityPanel } from "../components/build/ActivityPanel";
import { ReviewerSimulationPanel } from "../components/build/ReviewerSimulationPanel";
import { ValidationPanel } from "../components/build/ValidationPanel";
import { CasePicker } from "../components/build/CasePicker";
import { BuildControls } from "../components/build/BuildControls";
import { ComponentPalette } from "../components/build/ComponentPalette";
import { useBuildStore } from "../store/buildStore";
import { getRuntimeMode, registerTools, type RuntimeMode } from "../webmcp/registerTools";

const PcScene = lazy(() =>
  import("../components/scene/PcScene").then((module) => ({ default: module.PcScene })),
);

export function App() {
  const placements = useBuildStore((state) => state.placements);
  const [highlightedComponentIds, setHighlightedComponentIds] = useState<string[]>([]);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>(() => getRuntimeMode());
  const [toolCounts, setToolCounts] = useState<{ registered: number; total: number }>({
    registered: 0,
    total: 13,
  });

  useEffect(() => {
    let alive = true;
    let cleanup: () => void = () => undefined;
    void registerTools({ timeoutMs: 10000, intervalMs: 500 }).then((registration) => {
      if (alive) {
        setRuntimeMode(registration.mode);
        setToolCounts({
          registered: registration.registeredTools.length,
          total: registration.toolDefinitions.length,
        });
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

  const gpuPlacement = placements.find((placement) => placement.componentId.startsWith("gpu"));
  const radiatorPlacement = placements.find((placement) => placement.componentId.startsWith("radiator"));

  const statusBadgeText =
    runtimeMode === "webmcp"
      ? `WebMCP live transport (${toolCounts.registered}/${toolCounts.total} tools)`
      : runtimeMode === "partial"
        ? `WebMCP partial transport (${toolCounts.registered}/${toolCounts.total} tools)`
        : `Reviewer simulation (0/${toolCounts.total} tools)`;

  return (
    <main className="workspace-shell">
      <section className="debug-card" aria-labelledby="debug-title">
        <div className="eyebrow">AI PC Assembly Workspace</div>
        <div className="title-row">
          <div>
            <h1 id="debug-title">Build State Studio</h1>
            <p>One deterministic topology drives the GUI, the 3D scene, and WebMCP tools.</p>
          </div>
          <span className="status-badge">{statusBadgeText}</span>
        </div>

        <div className="scene-layout">
          <div className="scene-card">
            <Suspense fallback={<div className="scene-loading">Loading 3D workspace…</div>}>
              <PcScene highlightedComponentIds={highlightedComponentIds} />
            </Suspense>
            <div className="scene-overlay" aria-hidden="true">
              <span>LIVE BUILD STATE</span>
              <strong>{gpuPlacement ? `GPU · ${gpuPlacement.componentId} (${gpuPlacement.mountId})` : "GPU not installed"}</strong>
              <strong>{radiatorPlacement ? `Radiator · ${radiatorPlacement.componentId} (${radiatorPlacement.mountId})` : "Radiator not installed"}</strong>
              {highlightedComponentIds.length > 0 && <em>Conflict selected · affected models highlighted</em>}
            </div>
          </div>

          <aside className="controls-panel" aria-label="Build controls">
            <CasePicker />
            <BuildControls />
            <ComponentPalette />
            <div className="scene-hint">Drag to orbit · 'M' to arm Move Mode · Fullscreen 3D Viewer · Select any part size & mount</div>
          </aside>
        </div>

        <div className="insight-grid">
          <ValidationPanel onSelectionChange={setHighlightedComponentIds} />
          <ActivityPanel />
        </div>

        {runtimeMode !== "webmcp" && <ReviewerSimulationPanel />}

        <div className="debug-grid">
          <div><h2>Zustand placements ({placements.length})</h2><pre>{JSON.stringify({ placements }, null, 2)}</pre></div>
        </div>
      </section>
    </main>
  );
}
