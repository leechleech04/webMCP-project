import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import type { CaseProfile } from "../../domain/cases/types";
import { getRequiredCaseMountTransform } from "../../scene/caseMountTransforms";
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

export interface PcSceneProps {
  highlightedComponentIds?: string[];
}

export type SceneAppearanceMode = "STUDIO" | "DARK";

export const getCaseCameraPosition = (profile: CaseProfile): [number, number, number] => {
  const [tx, ty, tz] = profile.camera.target;
  const dist = profile.camera.distance;
  return [tx + dist * 0.72, ty + dist * 0.52, tz + dist * 0.82];
};

function StudioEnvironment({ mode }: { mode: SceneAppearanceMode }) {
  if (mode === "DARK") {
    return (
      <>
        <color attach="background" args={["#070b12"]} />
        <fog attach="fog" args={["#070b12", 28, 65]} />
        <ambientLight intensity={0.55} />
        <directionalLight intensity={1.2} position={[8, 12, 10]} color="#93c5fd" />
        <directionalLight intensity={0.7} position={[-8, 6, -8]} color="#38bdf8" />
        <pointLight color="#60a5fa" intensity={24} position={[-7, 7, 6]} />
      </>
    );
  }

  return (
    <>
      <color attach="background" args={["#e2e8f0"]} />
      <fog attach="fog" args={["#cbd5e1", 38, 70]} />
      <hemisphereLight args={["#ffffff", "#94a3b8", 1.35]} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[8, 14, 10]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight intensity={0.95} position={[-8, 6, -8]} color="#cbd5e1" />
      <directionalLight intensity={1.5} position={[0, 8, -12]} color="#93c5fd" />
    </>
  );
}

export function PcScene({ highlightedComponentIds = [] }: PcSceneProps) {
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

  const gpuInstalled = placements.some((placement) => placement.componentId.startsWith("gpu"));
  const radiatorPlacement = placements.find((placement) => placement.componentId === "radiator-01");

  const [appearanceMode, setAppearanceMode] = useState<SceneAppearanceMode>("STUDIO");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isMoveArmed, setIsMoveArmed] = useState(false);
  const [hoveredMountId] = useState<string | null>(null);
  const [cameraResetKey, setCameraResetKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD_PX = 6;

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
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      } else if ((e.key === "m" || e.key === "M") && selectedComponentId && selectedComponentId !== "case-01") {
        setIsMoveArmed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMoveArmed, selectedComponentId, isFullscreen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    pointerDownPos.current = null;

    if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
      return;
    }
  };

  const handleSelectComponent = (componentId: string) => {
    if (componentId.startsWith("case-")) return;
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
    } catch (err) {
      console.warn("Direct mount move failed:", err);
    }
  };

  const handleRemoveSelected = () => {
    if (!selectedPlacement) return;
    try {
      removeComponent({ componentId: selectedPlacement.componentId });
      setSelectedComponentId(null);
      setIsMoveArmed(false);
    } catch (err) {
      console.warn("Remove component failed:", err);
    }
  };

  const handleToggleFanDirection = () => {
    if (!selectedPlacement || !selectedComponentId?.startsWith("fan-")) return;
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
      className={`scene-canvas ${isFullscreen ? "scene-canvas-fullscreen" : ""}`}
      style={
        isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              background: appearanceMode === "STUDIO" ? "#e2e8f0" : "#070b12",
            }
          : undefined
      }
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      role="img"
      aria-label={`Mount-based PC assembly scene. GPU is ${gpuInstalled ? "installed" : "not installed"}. Radiator is ${radiatorPlacement ? `installed at ${radiatorPlacement.mountId}` : "not installed"}.`}
    >
      <div
        style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          zIndex: 10,
          display: "flex",
          gap: "0.45rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setAppearanceMode((prev) => (prev === "STUDIO" ? "DARK" : "STUDIO"))}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "6px",
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
            fontSize: "0.74rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {appearanceMode === "STUDIO" ? "☀️ Studio" : "🌙 Dark"}
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "6px",
            background: isFullscreen ? "#dc2626" : "#2563eb",
            color: "#ffffff",
            border: "none",
            fontSize: "0.74rem",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen 3D"}
        </button>

        <button
          type="button"
          onClick={() => setCameraResetKey((prev) => prev + 1)}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "6px",
            background: "#0f172a",
            color: "#94a3b8",
            border: "1px solid #334155",
            fontSize: "0.74rem",
            cursor: "pointer",
          }}
          title="Reset Camera View"
        >
          🎯 Reset View
        </button>
      </div>

      {selectedPlacement && selectedComponentDef && (
        <div
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.94)",
            border: errorComponentIds.has(selectedPlacement.componentId) ? "1px solid #ef4444" : "1px solid #3b82f6",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            maxWidth: "320px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.85rem", color: errorComponentIds.has(selectedPlacement.componentId) ? "#fca5a5" : "#60a5fa" }}>
              {selectedComponentDef.name}
            </strong>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{selectedPlacement.mountId}</span>
          </div>

          {errorComponentIds.has(selectedPlacement.componentId) && (
            <div style={{ fontSize: "0.72rem", color: "#fca5a5", fontWeight: 700 }}>
              ⚠️ Collision / Clearance Limit Exceeded
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
              {isMoveArmed ? "Cancel Move (Esc)" : "Move Component ('M')"}
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
                {selectedFanConfig.direction === "INTAKE" ? "🔵 INTAKE (Flip)" : "🔴 EXHAUST (Flip)"}
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
              Remove
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
        key={cameraResetKey}
        shadows
        camera={{ position: initialCameraPos, fov: activeProfile.camera.fov, near: 0.1, far: 120 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: appearanceMode === "STUDIO" ? 1.08 : 0.95,
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
        <StudioEnvironment mode={appearanceMode} />

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
            <Model
              key={placement.componentId}
              transform={transform}
              highlight={isHighlighted}
              component={componentRegistry[placement.componentId]}
            />
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