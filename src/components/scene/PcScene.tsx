import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import {
  getMountTransform,
  getRequiredMountTransform,
} from "../../scene/mountTransforms";
import { useBuildStore } from "../../store/buildStore";
import { CaseModel } from "./CaseModel";
import { GpuModel } from "./GpuModel";
import { MotherboardModel } from "./MotherboardModel";

const motherboardTransform = getRequiredMountTransform("motherboard-tray");

export function PcScene() {
  const gpuPlacement = useBuildStore((state) =>
    state.placements.find((placement) => placement.componentId === "gpu-01"),
  );
  const gpuTransform = gpuPlacement
    ? getMountTransform(gpuPlacement.mountId)
    : undefined;

  return (
    <div
      className="scene-canvas"
      role="img"
      aria-label={`Minimal PC assembly scene. GPU is ${gpuTransform ? "installed" : "not installed"}.`}
    >
      <Canvas
        shadows
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

        <CaseModel />
        <MotherboardModel transform={motherboardTransform} />
        {gpuTransform ? <GpuModel transform={gpuTransform} /> : null}

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
