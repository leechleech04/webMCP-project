import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import {
  getRequiredMountTransform,
} from "../../scene/mountTransforms";
import { getSceneModel } from "../../scene/modelRegistry";
import { useBuildStore } from "../../store/buildStore";
import { CaseModel } from "./CaseModel";
import { MotherboardModel } from "./MotherboardModel";

const motherboardTransform = getRequiredMountTransform("motherboard-tray");

export interface PcSceneProps {
  highlightedComponentIds?: string[];
}

export function PcScene({ highlightedComponentIds = [] }: PcSceneProps) {
  const placements = useBuildStore((state) => state.placements);
  const highlighted = new Set(highlightedComponentIds);
  const gpuInstalled = placements.some(
    (placement) => placement.componentId === "gpu-01",
  );
  const radiatorPlacement = placements.find(
    (placement) => placement.componentId === "radiator-01",
  );
  const caseInstalled = placements.some((placement) => placement.componentId === "case-01");
  const motherboardInstalled = placements.some((placement) => placement.componentId === "motherboard-01");

  return (
    <div
      className="scene-canvas"
      role="img"
      aria-label={`Mount-based PC assembly scene. GPU is ${gpuInstalled ? "installed" : "not installed"}. Radiator is ${radiatorPlacement ? `installed at ${radiatorPlacement.mountId}` : "not installed"}.`}
    >
      <Canvas
        shadows="basic"
        camera={{ position: [15, 11, 16], fov: 38, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#070b12"]} />
        <fog attach="fog" args={["#070b12", 24, 48]} />

        <ambientLight intensity={0.75} />
        <directionalLight
          castShadow
          intensity={2.4}
          position={[8, 14, 10]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight color="#60a5fa" intensity={32} position={[-7, 7, 6]} />

        {caseInstalled && <CaseModel />}
        {motherboardInstalled && <MotherboardModel transform={motherboardTransform} />}
        {placements.map((placement) => {
          if (placement.componentId === "case-01" || placement.componentId === "motherboard-01") return null;
          const Model = getSceneModel(placement.componentId);

          if (!Model) {
            return null;
          }

          const transform = getRequiredMountTransform(placement.mountId);

          return (
            <Model
              key={placement.componentId}
              transform={transform}
              highlight={highlighted.has(placement.componentId)}
            />
          );
        })}

        <Grid
          position={[0, -0.02, 0]}
          args={[32, 32]}
          cellColor="#1e3a5f"
          sectionColor="#334155"
          fadeDistance={30}
          infiniteGrid
        />

        <OrbitControls
          makeDefault
          target={[0, 3.4, 0]}
          minDistance={10}
          maxDistance={34}
          maxPolarAngle={Math.PI / 2.02}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
