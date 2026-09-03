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

      {/* PCIe x16 Slot Socket */}
      <group position={[0, -pcbDepth * 0.22, thickness * 0.8]}>
        {/* PCIe slot plastic housing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pcbWidth * 0.65, 0.18, 0.18]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.35} />
          <Edges color="#64748b" threshold={20} />
        </mesh>
        {/* PCIe slot central insertion channel */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[pcbWidth * 0.58, 0.05, 0.10]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
        {/* PCIe slot gold pin contacts */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[pcbWidth * 0.54, 0.02, 0.06]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* PCIe slot steel armor reinforcement */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[pcbWidth * 0.66, 0.19, 0.14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} wireframe />
        </mesh>
      </group>
    </group>
  );
}
