import { Edges } from "@react-three/drei";

import type { SceneTransform } from "../../scene/mountTransforms";

interface MotherboardModelProps {
  transform: SceneTransform;
}

export function MotherboardModel({ transform }: MotherboardModelProps) {
  return (
    <group
      name="motherboard-01"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6.1, 6.2, 0.28]} />
        <meshStandardMaterial color="#14532d" metalness={0.2} roughness={0.72} />
        <Edges color="#4ade80" threshold={15} />
      </mesh>

      <mesh position={[0.6, 0.9, 0.22]} castShadow>
        <boxGeometry args={[1.6, 1.6, 0.18]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.65} roughness={0.35} />
      </mesh>

      <mesh position={[-1.65, 0, 0.22]} castShadow>
        <boxGeometry args={[0.34, 3.8, 0.18]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}
