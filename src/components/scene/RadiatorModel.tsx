import { Edges } from "@react-three/drei";

import type { SceneTransform } from "../../scene/mountTransforms";

export interface RadiatorModelProps {
  transform: SceneTransform;
  highlight?: boolean;
}

export function RadiatorModel({ transform, highlight = false }: RadiatorModelProps) {
  return (
    <group
      name="radiator-01"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[7.8, 2.4, 0.5]} />
        <meshStandardMaterial color={highlight ? "#ef4444" : "#7c3aed"} emissive={highlight ? "#7f1d1d" : "#000000"} emissiveIntensity={highlight ? 0.65 : 0} metalness={0.45} roughness={0.4} />
        <Edges color={highlight ? "#fecaca" : "#c4b5fd"} threshold={15} />
      </mesh>

      {[-2.5, 0, 2.5].map((offset) => (
        <mesh
          key={offset}
          position={[offset, 0, 0.3]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.92, 0.92, 0.14, 24]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.25} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}
