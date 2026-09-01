import { Edges } from "@react-three/drei";
import type { SceneModelProps } from "../../scene/modelRegistry";

export function StorageModel({ transform, highlight = false }: SceneModelProps) {
  return (
    <group position={transform.position} rotation={transform.rotation} scale={transform.scale ?? [1, 1, 1]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.07, 1.6]} />
        <meshStandardMaterial color={highlight ? "#dc2626" : "#174d3b"} emissive={highlight ? "#ef4444" : "#000000"} emissiveIntensity={highlight ? 0.8 : 0} metalness={0.35} roughness={0.55} />
        <Edges color={highlight ? "#fecaca" : "#86efac"} />
      </mesh>
    </group>
  );
}
