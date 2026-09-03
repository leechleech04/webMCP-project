import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import { getRequiredCaseMountTransform } from "../../scene/caseMountTransforms";
import { getCaseCameraPosition } from "../../scene/camera";
import { deriveAirflowScene } from "../../domain/airflow/deriveAirflowScene";
import { getCompatibleMountCandidates } from "../../domain/interaction/getCompatibleMounts";
import { componentRegistry } from "../../domain/data/components";
import { getSceneModel } from "../../scene/modelRegistry";
import { moveComponent } from "../../domain/commands/moveComponent";
import { removeComponent } from "../../domain/commands/removeComponent";
import { setFanDirection } from "../../domain/commands/setFanDirection";
import { validateBuild } from "../../domain/constraints/validateBuild";
import { AirflowVisualization } from "./AirflowVisualization";
import { CaseModel } from "./CaseModel";
import { MountIndicators } from "./MountIndicators";
import { useLanguage } from "../../i18n/LanguageContext";

export interface PcSceneProps {
  highlightedComponentIds?: string[];
}

export type SceneAppearanceMode = "STUDIO" | "DARK";

function SelectableSceneModel({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>{children}</group>;
}

function StudioEnvironment({ mode }: { mode: SceneAppearanceMode }) {
  if (mode === "DARK") {
    return (
      <>
        <color attach="background" args={["#070b12"]} />
        <fog attach="fog" args={["#070b12", 28, 65]} />
        <ambientLight intensity={0.5} />
        <directionalLight intensity={1.0} position={[8, 12, 10]} color="#d1d5db" />
        <directionalLight intensity={0.45} position={[-8, 6, -8]} color="#94a3b8" />
      </>
    );
  }

  return (
    <>
      <color attach="background" args={["#e9edf2"]} />
      <fog attach="fog" args={["#d4dae3", 42, 75]} />
      <hemisphereLight args={["#ffffff", "#c8cdd5", 1.10]} />
      <directionalLight
        castShadow
        intensity={1.65}
        position={[7, 12, 8]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        color="#ffffff"
      />
      <directionalLight intensity={0.42} position={[-6, 5, -7]} color="#e5e7eb" />
      <directionalLight intensity={0.32} position={[0, 7, -10]} color="#dde2e8" />
    </>
  );
}

export function PcScene({ highlightedComponentIds = [] }: PcSceneProps) {
  const { t, componentName } = useLanguage();
  const state = useBuildStore((s) => s);
  const placements = useBuildStore((s) => s.placements);
  const activeProfile = useMemo(() => getActiveCaseProfile(state), [state]);
  const airflow = useMemo(() => deriveAirflowScene(state, activeProfile), [state, activeProfile]);
  const validationIssues = useMemo(() => validateBuild(state), [state]);

  const errorComponentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const issue of validationIssues) {
      if (issue.severity === "ERROR" || issue.type === "CLEARANCE" || issue.type === "CABLE") {
        for (const cid of issue.affectedComponentIds) {
          ids.add(cid);
        }
      }
    }
    return ids;
  }, [validationIssues]);

  const gpuInstalled = placements.some((placement) => componentRegistry[placement.componentId]?.type === "GPU");
  const radiatorPlacement = placements.find((placement) => componentRegistry[placement.componentId]?.type === "RADIATOR");

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isMoveArmed, setIsMoveArmed] = useState(false);
  const [hoveredMountId] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlacement = useMemo(
    () => placements.find((p) => p.componentId === selectedComponentId),
    [placements, selectedComponentId],
  );

  const selectedComponentDef = useMemo(
    () => (selectedComponentId ? componentRegistry[selectedComponentId] : null),
    [selectedComponentId],
  );

  const compatibleMountCandidates = useMemo(() => {
    if (!selectedComponentDef || !selectedPlacement) return [];
    return getCompatibleMountCandidates({
      componentId: selectedPlacement.componentId,
      currentMountId: selectedPlacement.mountId,
      state,
      caseProfile: activeProfile,
    });
  }, [selectedComponentDef, selectedPlacement, state, activeProfile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMoveArmed) {
          setIsMoveArmed(false);
        } else if (selectedComponentId) {
          setSelectedComponentId(null);
        }
      } else if ((e.key === "m" || e.key === "M") && selectedComponentId && componentRegistry[selectedComponentId]?.type !== "CASE") {
        setIsMoveArmed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMoveArmed, selectedComponentId]);

  const handleSelectComponent = (componentId: string) => {
    if (componentRegistry[componentId]?.type === "CASE") return;
    setSelectedComponentId((prev) => (prev === componentId ? null : componentId));
    setIsMoveArmed(false);
  };

  const handleDirectMountClick = (targetMountId: string) => {
    if (!selectedPlacement) return;
    try {
      moveComponent({
        componentId: selectedPlacement.componentId,
        mountId: targetMountId,
      });
      setIsMoveArmed(false);
      setSelectedComponentId(null);
      setInteractionError(null);
    } catch (err) {
      console.warn("Direct mount move failed:", err);
      setInteractionError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemoveSelected = () => {
    if (!selectedPlacement) return;
    try {
      removeComponent({ componentId: selectedPlacement.componentId });
      setSelectedComponentId(null);
      setIsMoveArmed(false);
      setInteractionError(null);
    } catch (err) {
      console.warn("Remove component failed:", err);
      setInteractionError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleToggleFanDirection = () => {
    if (!selectedPlacement || !selectedComponentId || componentRegistry[selectedComponentId]?.type !== "FAN") return;
    const currentCfg = state.fanConfigs.find((c) => c.componentId === selectedComponentId);
    const nextDir = currentCfg?.direction === "EXHAUST" ? "INTAKE" : "EXHAUST";
    setFanDirection({ componentId: selectedComponentId, direction: nextDir });
  };

  const selectedFanConfig = useMemo(
    () => (selectedComponentId ? state.fanConfigs.find((c) => c.componentId === selectedComponentId) : null),
    [state.fanConfigs, selectedComponentId],
  );

  const initialCameraPos = useMemo(() => getCaseCameraPosition(activeProfile), [activeProfile]);

  return (
    <div
      ref={containerRef}
      className="scene-canvas"
      role="region"
      aria-label={t("scene.aria", {
        gpu: gpuInstalled ? t("scene.installed") : t("scene.notInstalled"),
        radiator: radiatorPlacement ? t("scene.installedAt", { mount: radiatorPlacement.mountId }) : t("scene.notInstalled"),
      })}
    >
      {interactionError && (
        <div className="scene-error" role="alert">
          <span>{interactionError}</span>
          <button type="button" onClick={() => setInteractionError(null)} aria-label={t("scene.dismissError")}>×</button>
        </div>
      )}

      {selectedPlacement && selectedComponentDef && (
        <div
          className="scene-selection-panel"
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            zIndex: 10,
            maxWidth: "340px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.85rem", color: errorComponentIds.has(selectedPlacement.componentId) ? "#fca5a5" : "#60a5fa" }}>
              {componentName(selectedComponentDef.id, selectedComponentDef.name)}
            </strong>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{selectedPlacement.mountId}</span>
          </div>

          {errorComponentIds.has(selectedPlacement.componentId) && (
            <div style={{ fontSize: "0.72rem", color: "#fca5a5", fontWeight: 700 }}>
              {t("scene.collision")}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
            <button
              type="button"
              onClick={() => setIsMoveArmed((prev) => !prev)}
              style={{
                padding: "0.3rem 0.6rem",
                borderRadius: "6px",
                background: isMoveArmed ? "#3b82f6" : "#1e293b",
                color: "#ffffff",
                border: "1px solid #3b82f6",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              {isMoveArmed ? t("scene.cancelMove") : t("scene.move")}
            </button>

            {selectedFanConfig && (
              <button
                type="button"
                onClick={handleToggleFanDirection}
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  background: selectedFanConfig.direction === "INTAKE" ? "#1e3a8a" : "#7f1d1d",
                  color: selectedFanConfig.direction === "INTAKE" ? "#93c5fd" : "#fca5a5",
                  border: "1px solid #3b82f6",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              >
                {selectedFanConfig.direction === "INTAKE" ? t("scene.intakeFlip") : t("scene.exhaustFlip")}
              </button>
            )}

            <button
              type="button"
              onClick={handleRemoveSelected}
              style={{
                padding: "0.3rem 0.6rem",
                borderRadius: "6px",
                background: "#7f1d1d",
                color: "#fecaca",
                border: "1px solid #dc2626",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              {t("scene.remove")}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedComponentId(null);
                setIsMoveArmed(false);
              }}
              style={{
                padding: "0.3rem 0.5rem",
                borderRadius: "6px",
                background: "#334155",
                color: "#94a3b8",
                border: "none",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Canvas
        shadows="basic"
        camera={{ position: initialCameraPos, fov: activeProfile.camera.fov, near: 0.1, far: 120 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
      >
        <OrbitControls
          makeDefault
          target={activeProfile.camera.target}
          minDistance={activeProfile.camera.minDistance}
          maxDistance={activeProfile.camera.maxDistance}
          enableDamping
          dampingFactor={0.06}
        />
        <StudioEnvironment mode="STUDIO" />

        <CaseModel />

        {placements.map((placement) => {
          if (placement.mountId === "case-root") return null;
          const Model = getSceneModel(placement.componentId);
          if (!Model) return null;

          const transform = getRequiredCaseMountTransform(activeProfile, placement.mountId);
          const isSelected = selectedComponentId === placement.componentId;
          const hasCollisionOrError = errorComponentIds.has(placement.componentId);
          const isHighlighted = highlightedComponentIds.length > 0
            ? highlightedComponentIds.includes(placement.componentId)
            : (hasCollisionOrError || isSelected);

          return (
            <SelectableSceneModel
              key={placement.componentId}
              onSelect={() => handleSelectComponent(placement.componentId)}
            >
              <Model
                transform={transform}
                highlight={isHighlighted}
                component={componentRegistry[placement.componentId]}
              />
            </SelectableSceneModel>
          );
        })}

        <AirflowVisualization airflow={airflow} enabled={true} />

        {isMoveArmed && selectedPlacement && (
          <MountIndicators
            mountCandidates={compatibleMountCandidates}
            hoveredMountId={hoveredMountId}
            onSelectMount={handleDirectMountClick}
          />
        )}
      </Canvas>
    </div>
  );
}
