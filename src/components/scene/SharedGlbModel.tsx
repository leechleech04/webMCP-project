import { Edges } from "@react-three/drei";
import type { SceneModelProps } from "../../scene/modelRegistry";
import { GlbAsset } from "./GlbAsset";

const sceneDimensions = (component: NonNullable<SceneModelProps["component"]>): [number, number, number] => {
  const { width, height, depth } = component.dimensions;
  if (component.type === "MOTHERBOARD") return [width, depth, height];
  if (component.type === "RAM") return [depth, width, height];
  if (component.type === "CPU") return [width, depth, height];
  if (component.type === "FAN") return [width, depth, height];
  return [width, height, depth];
};

export function SharedGlbModel({ transform, highlight = false, component }: SceneModelProps) {
  if (!component?.visualAsset?.url) return null;
  const target = sceneDimensions(component).map((value) => value * 0.02) as [number, number, number];
  const native = component.visualAsset.nativeDimensions ?? { width: 1, height: 1, depth: 1 };
  const scale: [number, number, number] = [
    target[0] / native.width,
    target[1] / native.height,
    target[2] / native.depth,
  ];
  const fallback = (
    <mesh castShadow receiveShadow scale={target}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={highlight ? "#dc2626" : "#475569"} metalness={0.35} roughness={0.55} />
      <Edges color={highlight ? "#fecaca" : "#94a3b8"} />
    </mesh>
  );

  return (
    <group name={component.id} position={transform.position} rotation={transform.rotation} scale={transform.scale ?? [1, 1, 1]}>
      <GlbAsset url={component.visualAsset.url} scale={scale} fallback={fallback} />
      {highlight && (
        <mesh scale={target.map((value) => value * 1.04) as [number, number, number]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.15} wireframe />
        </mesh>
      )}
    </group>
  );
}
