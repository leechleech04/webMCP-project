import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";

export function CpuModel({
  transform,
  highlight = false,
  component,
}: {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}) {
  const size = (component?.dimensions.width ?? 45) * 0.02; // 0.9 units for 45mm
  const height = (component?.dimensions.height ?? 5) * 0.02; // 0.1 units for 5mm

  return (
    <group
      name={component?.id ?? "cpu-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <mesh castShadow>
        <boxGeometry args={[size, size, height]} />
        <meshStandardMaterial
          color={highlight ? "#dc2626" : "#94a3b8"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.9 : 0}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0, height * 0.6]}>
        <boxGeometry args={[size * 0.75, size * 0.75, 0.03]} />
        <meshStandardMaterial
          color={highlight ? "#fca5a5" : "#cbd5e1"}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
