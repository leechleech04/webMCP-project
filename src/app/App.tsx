import { useState } from "react";

import { installComponent } from "../domain/commands/installComponent";
import { moveComponent } from "../domain/commands/moveComponent";
import { removeComponent } from "../domain/commands/removeComponent";
import { componentRegistry } from "../domain/data/components";
import { mountRegistry } from "../domain/data/mounts";
import { PcScene } from "../components/scene/PcScene";
import { useBuildStore } from "../store/buildStore";

const GPU_ID = "gpu-01";
const GPU_MOUNT_ID = "pcie-slot-1";
const RADIATOR_ID = "radiator-01";
const RADIATOR_FRONT_MOUNT_ID = "radiator-front";
const RADIATOR_TOP_MOUNT_ID = "radiator-top";

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
  const radiator = componentRegistry[RADIATOR_ID];
  const gpuPlacement = placements.find(
    (placement) => placement.componentId === GPU_ID,
  );
  const radiatorPlacement = placements.find(
    (placement) => placement.componentId === RADIATOR_ID,
  );
  const gpuMount = gpuPlacement
    ? mountRegistry[gpuPlacement.mountId]
    : undefined;

  const runCommand = (command: () => void, successMessage: string) => {
    try {
      command();
      setCommandMessage(successMessage);
    } catch (error) {
      setCommandMessage(getErrorMessage(error));
    }
  };

  const handleInstallGpu = () =>
    runCommand(
      () => installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID }),
      "GPU installed at PCIE_SLOT_1.",
    );

  const handleRemoveGpu = () =>
    runCommand(
      () => removeComponent({ componentId: GPU_ID }),
      "GPU removed from the build.",
    );

  const handleInstallRadiator = () =>
    runCommand(
      () =>
        installComponent({
          componentId: RADIATOR_ID,
          mountId: RADIATOR_FRONT_MOUNT_ID,
        }),
      "Radiator installed at RADIATOR_FRONT.",
    );

  const handleMoveRadiator = (mountId: string) =>
    runCommand(
      () => moveComponent({ componentId: RADIATOR_ID, mountId }),
      `Radiator moved to ${formatMountLabel(mountId)}.`,
    );

  const handleRemoveRadiator = () =>
    runCommand(
      () => removeComponent({ componentId: RADIATOR_ID }),
      "Radiator removed from the build.",
    );

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
            <h1 id="debug-title">Build State Debug</h1>
            <p>
              Stage 5 resolves Mount IDs into 3D transforms inside the scene.
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
              <strong>
                {radiatorPlacement
                  ? `Radiator · ${formatMountLabel(radiatorPlacement.mountId)}`
                  : "Radiator not installed"}
              </strong>
            </div>
          </div>

          <aside className="controls-panel" aria-label="Build controls">
            <div className="component-control">
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
                <button type="button" onClick={handleInstallGpu} disabled={!!gpuPlacement}>
                  Install GPU
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleRemoveGpu}
                  disabled={!gpuPlacement}
                >
                  Remove GPU
                </button>
              </div>
            </div>

            <div className="component-control">
              <div className="component-summary">
                <div className="component-icon radiator" aria-hidden="true">
                  RAD
                </div>
                <div>
                  <strong>{radiator.name}</strong>
                  <span>{radiator.dimensions.depth} mm · Front / Top</span>
                </div>
                <span
                  className={radiatorPlacement ? "install-state installed" : "install-state"}
                >
                  {radiatorPlacement
                    ? formatMountLabel(radiatorPlacement.mountId)
                    : "Available"}
                </span>
              </div>

              <div className="command-row radiator-commands">
                <button
                  type="button"
                  onClick={handleInstallRadiator}
                  disabled={!!radiatorPlacement}
                >
                  Install Front
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleMoveRadiator(RADIATOR_TOP_MOUNT_ID)}
                  disabled={!radiatorPlacement || radiatorPlacement.mountId === RADIATOR_TOP_MOUNT_ID}
                >
                  Move Top
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleMoveRadiator(RADIATOR_FRONT_MOUNT_ID)}
                  disabled={!radiatorPlacement || radiatorPlacement.mountId === RADIATOR_FRONT_MOUNT_ID}
                >
                  Move Front
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleRemoveRadiator}
                  disabled={!radiatorPlacement}
                >
                  Remove
                </button>
              </div>
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
