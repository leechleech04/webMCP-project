import { Edges } from "@react-three/drei";

import type { SceneTransform } from "../../scene/mountTransforms";

export interface GpuModelProps {
  transform: SceneTransform;
  highlight?: boolean;
}

export function GpuModel({ transform, highlight = false }: GpuModelProps) {
  return (
    <group
      name="gpu-01"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 1, 8]} />
        <meshStandardMaterial color={highlight ? "#ef4444" : "#2563eb"} emissive={highlight ? "#7f1d1d" : "#000000"} emissiveIntensity={highlight ? 0.65 : 0} metalness={0.55} roughness={0.34} />
        <Edges color={highlight ? "#fecaca" : "#93c5fd"} threshold={15} />
      </mesh>

      <mesh position={[0, 0.54, 0]} castShadow>
        <boxGeometry args={[2.7, 0.08, 7.3]} />
        <meshStandardMaterial color="#0f172a" metalness={0.25} roughness={0.7} />
      </mesh>
    </group>
  );
}
