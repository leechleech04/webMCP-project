import { Edges } from "@react-three/drei";
import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";

export function RamModel({
  transform,
  highlight = false,
  component,
}: {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}) {
  const ramLength = (component?.dimensions.width ?? 133) * 0.02; // 2.66 units for 133mm
  const ramHeight = (component?.dimensions.height ?? 35) * 0.02; // 0.7 units for 35mm, 0.84 for 42mm RGB
  const ramThick = (component?.dimensions.depth ?? 7) * 0.02;   // 0.14 units for 7mm

  return (
    <group
      name={component?.id ?? "ram-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      {/* 1. Anodized Aluminum Heat Spreader */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[ramThick, ramLength, ramHeight]} />
        <meshStandardMaterial
          color={highlight ? "#dc2626" : "#0284c7"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.9 : 0}
          metalness={0.7}
          roughness={0.25}
        />
        <Edges color={highlight ? "#fca5a5" : "#38bdf8"} threshold={15} />
      </mesh>

      {/* 2. Top Glowing ARGB Light Diffuser Strip */}
      <mesh position={[0, 0, ramHeight * 0.48]}>
        <boxGeometry args={[ramThick * 1.25, ramLength * 0.96, 0.1]} />
        <meshStandardMaterial
          color={highlight ? "#fecaca" : "#e0f2fe"}
          emissive={highlight ? "#ef4444" : "#38bdf8"}
          emissiveIntensity={highlight ? 0.95 : 0.85}
        />
      </mesh>

      {/* 3. Center Metallic Branding Badge */}
      <mesh position={[ramThick * 0.52, 0, 0]}>
        <boxGeometry args={[0.02, ramLength * 0.35, ramHeight * 0.45]} />
        <meshStandardMaterial
          color={highlight ? "#b91c1c" : "#0f172a"}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* 4. Bottom Gold Edge Connector Pins */}
      <mesh position={[0, 0, -ramHeight * 0.48]}>
        <boxGeometry args={[0.04, ramLength * 0.92, 0.08]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}