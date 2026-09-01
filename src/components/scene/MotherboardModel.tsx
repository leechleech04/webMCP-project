import { Edges } from "@react-three/drei";
import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";

export interface MotherboardModelProps {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}

export function MotherboardModel({ transform, highlight = false, component }: MotherboardModelProps) {
  // Physical mm to scene units
  const pcbDepth = (component?.dimensions.depth ?? 305) * 0.02; // 6.1 for ATX (305mm), 3.4 for Mini-ITX (170mm)
  const pcbWidth = (component?.dimensions.width ?? 244) * 0.02; // 4.88 for ATX (244mm), 3.4 for Mini-ITX (170mm)
  const thickness = 0.22;

  return (
    <group
      name={component?.id ?? "motherboard-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      {/* PCB Board */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[pcbWidth, pcbDepth, thickness]} />
        <meshStandardMaterial
          color={highlight ? "#dc2626" : "#14532d"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.85 : 0}
          metalness={0.2}
          roughness={0.72}
        />
        <Edges color={highlight ? "#fca5a5" : "#4ade80"} threshold={15} />
      </mesh>

      {/* VRM / I/O Shield Heatsink */}
      <mesh position={[pcbWidth * 0.22, pcbDepth * 0.25, thickness * 0.8]} castShadow>
        <boxGeometry args={[pcbWidth * 0.35, pcbDepth * 0.32, 0.22]} />
        <meshStandardMaterial
          color={highlight ? "#b91c1c" : "#334155"}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Chipset Heatsink */}
      <mesh position={[-pcbWidth * 0.22, -pcbDepth * 0.22, thickness * 0.7]} castShadow>
        <boxGeometry args={[pcbWidth * 0.28, pcbDepth * 0.26, 0.18]} />
        <meshStandardMaterial
          color={highlight ? "#991b1b" : "#1e293b"}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
