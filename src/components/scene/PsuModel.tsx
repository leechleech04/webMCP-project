import { Edges } from "@react-three/drei";
import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";

export function PsuModel({
  transform,
  highlight = false,
  component,
}: {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}) {
  const psuDepth = (component?.dimensions.depth ?? 180) * 0.02;   // 3.6 for ATX (180mm), 2.0 for SFX (100mm)
  const psuWidth = (component?.dimensions.width ?? 150) * 0.02;   // 3.0 for ATX (150mm), 2.5 for SFX (125mm)
  const psuHeight = (component?.dimensions.height ?? 86) * 0.02;  // 1.72 for ATX (86mm), 1.27 for SFX (63.5mm)

  return (
    <group
      name={component?.id ?? "psu-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      {/* PSU Metal Enclosure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[psuWidth, psuHeight, psuDepth]} />
        <meshStandardMaterial
          color={highlight ? "#dc2626" : "#1e293b"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.9 : 0}
          metalness={0.7}
          roughness={0.3}
        />
        <Edges color={highlight ? "#fca5a5" : "#475569"} threshold={15} />
      </mesh>

      {/* Top Fan Intake Grill */}
      <mesh position={[0, psuHeight * 0.52, 0]}>
        <boxGeometry args={[psuWidth * 0.82, 0.04, psuWidth * 0.82]} />
        <meshStandardMaterial
          color={highlight ? "#ef4444" : "#0f172a"}
          metalness={0.85}
          roughness={0.2}
          wireframe
        />
      </mesh>
    </group>
  );
}
