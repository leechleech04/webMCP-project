import { Edges } from "@react-three/drei";
import type { SceneModelProps } from "../../scene/modelRegistry";
import { GlbAsset } from "./GlbAsset";

/**
 * CPU socket mounts are points on the motherboard's visible face. The cooler's
 * physical height therefore extends along +X (the board normal), rather than
 * along world Y as it did previously. Its fin stack is centred half a cooler
 * height away from the CPU so it touches the heat spreader without intersecting it.
 */
export function AirCoolerModel({ transform, highlight = false, component }: SceneModelProps) {
  if (!component) return null;
  const width = component.dimensions.width * 0.02;
  const height = component.dimensions.height * 0.02;
  const depth = component.dimensions.depth * 0.02;
  const native = component.visualAsset?.nativeDimensions ?? { width: 1, height: 1, depth: 1 };
  const scale: [number, number, number] = [width / native.width, height / native.height, depth / native.depth];
  const fallback = (
    <mesh castShadow receiveShadow scale={[width, height, depth]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={highlight ? "#dc2626" : "#64748b"} metalness={0.7} roughness={0.32} />
      <Edges color={highlight ? "#fecaca" : "#cbd5e1"} />
    </mesh>
  );

  return (
    <group name={component.id} position={transform.position} rotation={transform.rotation} scale={transform.scale ?? [1, 1, 1]}>
      <group position={[height / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        {component.visualAsset?.url ? <GlbAsset url={component.visualAsset.url} scale={scale} fallback={fallback} /> : fallback}
        {highlight && (
          <mesh scale={[width * 1.04, height * 1.04, depth * 1.04]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.14} wireframe />
          </mesh>
        )}
      </group>
    </group>
  );
}
