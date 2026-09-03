import { Edges } from "@react-three/drei";
import type { SceneModelProps } from "../../scene/modelRegistry";

export function StorageModel({ transform, highlight = false, component }: SceneModelProps) {
  const width = (component?.dimensions.width ?? 22) * 0.02;
  const height = (component?.dimensions.height ?? 3.5) * 0.02;
  const depth = (component?.dimensions.depth ?? 80) * 0.02;

  return (
    <group
      name={component?.id ?? "storage-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale ?? [1, 1, 1]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={highlight ? "#dc2626" : "#174d3b"} emissive={highlight ? "#ef4444" : "#000000"} emissiveIntensity={highlight ? 0.8 : 0} metalness={0.35} roughness={0.55} />
        <Edges color={highlight ? "#fecaca" : "#86efac"} />
      </mesh>
    </group>
  );
}
