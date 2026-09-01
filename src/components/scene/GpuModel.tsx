import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";

export interface GpuModelProps {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}

export function GpuModel({ transform, highlight = false, component }: GpuModelProps) {
  const fanGroupRef = useRef<THREE.Group>(null);

  // Scale physical mm to scene units (x0.02)
  const length = (component?.dimensions.depth ?? 340) * 0.02; // 6.8 for 340mm, 4.84 for 242mm, 3.4 for 170mm
  const width = (component?.dimensions.width ?? 150) * 0.02;   // 3.0 for 150mm
  const height = (component?.dimensions.height ?? 70) * 0.02;  // 1.4 for 70mm, 0.9 for 45mm, 0.8 for 40mm

  // Determine fan count based on physical length
  const fanCount = length > 5.5 ? 3 : length > 4.0 ? 2 : 1;
  const fanRadius = Math.min(width * 0.36, (length / fanCount) * 0.42);

  // Spin GPU cooling fans in real-time
  useFrame((_, delta) => {
    if (fanGroupRef.current) {
      fanGroupRef.current.children.forEach((fan) => {
        fan.rotation.y += delta * 7.0;
      });
    }
  });

  return (
    <group
      name={component?.id ?? "gpu-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale ?? [1, 1, 1]}
    >
      {/* 1. Main GPU Die-Cast Aluminum Shroud */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.85, length]} />
        <meshStandardMaterial
          color={highlight ? "#dc2626" : "#1e293b"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.9 : 0}
          metalness={0.7}
          roughness={0.3}
        />
        <Edges color={highlight ? "#fca5a5" : "#38bdf8"} threshold={15} />
      </mesh>

      {/* 2. Top Face Cooling Fan Shroud & Impellers (Facing +Y) */}
      <group ref={fanGroupRef} position={[0, height * 0.44, 0]}>
        {Array.from({ length: fanCount }).map((_, idx) => {
          const offsetZ =
            fanCount === 1
              ? 0
              : (idx - (fanCount - 1) / 2) * ((length * 0.82) / Math.max(1, fanCount - 1));

          return (
            <group key={idx} position={[0, 0, offsetZ]}>
              {/* Fan Recessed Well */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[fanRadius, fanRadius, 0.06, 24]} />
                <meshStandardMaterial color="#090d16" roughness={0.8} />
              </mesh>

              {/* Fan Motor Hub */}
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[fanRadius * 0.32, fanRadius * 0.32, 0.06, 16]} />
                <meshStandardMaterial
                  color={highlight ? "#ef4444" : "#0284c7"}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>

              {/* 9 Swept Blades */}
              {Array.from({ length: 9 }).map((__, bIdx) => {
                const bAngle = (bIdx * Math.PI * 2) / 9;
                const bLen = fanRadius * 0.65;
                return (
                  <mesh
                    key={bIdx}
                    position={[
                      Math.cos(bAngle) * (fanRadius * 0.32 + bLen * 0.45),
                      0.04,
                      Math.sin(bAngle) * (fanRadius * 0.32 + bLen * 0.45),
                    ]}
                    rotation={[0.3, -bAngle, 0]}
                  >
                    <boxGeometry args={[bLen, 0.02, fanRadius * 0.22]} />
                    <meshStandardMaterial
                      color={highlight ? "#f87171" : "#38bdf8"}
                      emissive={highlight ? "#ef4444" : "#0284c7"}
                      emissiveIntensity={highlight ? 0.8 : 0.4}
                      roughness={0.2}
                    />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>

      {/* 3. Bottom Brushed Aluminum Backplate (Facing -Y) */}
      <mesh position={[0, -height * 0.44, 0]} castShadow>
        <boxGeometry args={[width * 0.94, 0.06, length * 0.96]} />
        <meshStandardMaterial
          color={highlight ? "#991b1b" : "#0f172a"}
          metalness={0.85}
          roughness={0.25}
        />
        <Edges color={highlight ? "#fca5a5" : "#64748b"} threshold={20} />
      </mesh>

      {/* 4. Rear Stainless Steel Expansion Slot I/O Bracket (-Z) */}
      <mesh position={[0, 0, -length * 0.51]}>
        <boxGeometry args={[width * 0.75, height * 1.15, 0.06]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* DisplayPort & HDMI Ports on Rear Bracket */}
      <mesh position={[-width * 0.18, 0, -length * 0.52]}>
        <boxGeometry args={[width * 0.22, height * 0.28, 0.04]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      <mesh position={[width * 0.18, 0, -length * 0.52]}>
        <boxGeometry args={[width * 0.22, height * 0.28, 0.04]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* 5. PCIe x16 Gold Fingers Edge Connector (-X side, plugs into motherboard) */}
      <mesh position={[-width * 0.48, 0, -length * 0.15]}>
        <boxGeometry args={[0.06, height * 0.45, length * 0.42]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* 6. Side ARGB Illuminated Branding Strip (+X side) */}
      <mesh position={[width * 0.51, 0, 0]}>
        <boxGeometry args={[0.04, height * 0.35, length * 0.65]} />
        <meshStandardMaterial
          color={highlight ? "#fecaca" : "#38bdf8"}
          emissive={highlight ? "#ef4444" : "#0284c7"}
          emissiveIntensity={highlight ? 0.95 : 0.8}
        />
      </mesh>
    </group>
  );
}