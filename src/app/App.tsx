import { useState } from "react";

import { installComponent } from "../domain/commands/installComponent";
import { removeComponent } from "../domain/commands/removeComponent";
import { componentRegistry } from "../domain/data/components";
import { mountRegistry } from "../domain/data/mounts";
import { PcScene } from "../components/scene/PcScene";
import { useBuildStore } from "../store/buildStore";

const GPU_ID = "gpu-01";
const GPU_MOUNT_ID = "pcie-slot-1";

const formatMountLabel = (mountId: string): string =>
  mountId.replaceAll("-", "_").toUpperCase();

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "The command could not be completed.";

export function App() {
  const placements = useBuildStore((state) => state.placements);
  const [commandMessage, setCommandMessage] = useState(
    "Run a domain command to change the shared Build State.",
  );

  const gpu = componentRegistry[GPU_ID];
  const gpuPlacement = placements.find(
    (placement) => placement.componentId === GPU_ID,
  );
  const gpuMount = gpuPlacement
    ? mountRegistry[gpuPlacement.mountId]
    : undefined;

  const handleInstall = () => {
    try {
      installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID });
      setCommandMessage("installComponent completed successfully.");
    } catch (error) {
      setCommandMessage(getErrorMessage(error));
    }
  };

  const handleRemove = () => {
    try {
      removeComponent({ componentId: GPU_ID });
      setCommandMessage("removeComponent completed successfully.");
    } catch (error) {
      setCommandMessage(getErrorMessage(error));
    }
  };

  const debugOutput = [
    `GPU: ${gpuPlacement ? "Installed" : "Not installed"}`,
    `Mount: ${gpuMount ? formatMountLabel(gpuMount.id) : "NONE"}`,
  ].join("\n");

  return (
    <main className="workspace-shell">
      <section className="debug-card" aria-labelledby="debug-title">
        <div className="eyebrow">AI PC Assembly Workspace</div>
        <div className="title-row">
          <div>
            <h1 id="debug-title">Build State Debug</h1>
            <p>
              Step 3 renders the same shared Build State in a minimal 3D scene.
            </p>
          </div>
          <span className="status-badge">BoxGeometry prototype</span>
        </div>

        <div className="scene-layout">
          <div className="scene-card">
            <PcScene />
            <div className="scene-overlay" aria-hidden="true">
              <span>LIVE BUILD STATE</span>
              <strong>{gpuPlacement ? "GPU installed" : "GPU not installed"}</strong>
            </div>
          </div>

          <aside className="controls-panel" aria-label="Build controls">
            <div className="component-summary">
              <div className="component-icon" aria-hidden="true">
                GPU
              </div>
              <div>
                <strong>{gpu.name}</strong>
                <span>{gpu.dimensions.depth} mm · {gpu.power?.consumption} W</span>
              </div>
              <span
                className={gpuPlacement ? "install-state installed" : "install-state"}
              >
                {gpuPlacement ? "Installed" : "Available"}
              </span>
            </div>

            <div className="command-row">
              <button type="button" onClick={handleInstall} disabled={!!gpuPlacement}>
                Install GPU
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleRemove}
                disabled={!gpuPlacement}
              >
                Remove GPU
              </button>
            </div>

            <p className="command-message" role="status">
              {commandMessage}
            </p>

            <div className="scene-hint">
              Drag to orbit · Scroll to zoom
            </div>
          </aside>
        </div>

        <div className="debug-grid">
          <div>
            <h2>Human-readable state</h2>
            <pre>{debugOutput}</pre>
          </div>
          <div>
            <h2>Zustand placements</h2>
            <pre>{JSON.stringify({ placements }, null, 2)}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
