import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";

export interface FanModelProps {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}

export function FanModel({ transform, highlight = false, component }: FanModelProps) {
  const rotorRef = useRef<THREE.Group>(null);
  const sizeMm = component?.dimensions.width ?? 120;
  const size = sizeMm * 0.02;  // 2.4 for 120mm, 2.8 for 140mm, 3.2 for 160mm
  const thick = (component?.dimensions.height ?? 25) * 0.02; // 0.5 for 25mm, 0.6 for 30mm
  const holeOffset = size * 0.42;

  const isNoctua = Boolean(
    component?.id?.toLowerCase().includes("noctua") ||
    component?.name?.toLowerCase().includes("noctua") ||
    component?.manufacturer?.toLowerCase().includes("noctua")
  );
  const isArgb = Boolean(
    component?.connectors?.some((c) => c.type === "ARGB") ||
    component?.name?.toLowerCase().includes("argb")
  );

  // Authentic color palettes
  const frameColor = highlight ? "#dc2626" : (isNoctua ? "#d8caa8" : "#1e293b");
  const padColor = highlight ? "#991b1b" : (isNoctua ? "#442f22" : "#0f172a");
  const statorColor = highlight ? "#7f1d1d" : (isNoctua ? "#38251a" : "#0b1120");
  const hubColor = highlight ? "#b91c1c" : (isNoctua ? "#523728" : "#1e293b");
  const bladeColor = highlight ? "#ef4444" : (isNoctua ? "#694735" : (isArgb ? "#38bdf8" : "#334155"));
  const bladeEmissive = highlight ? "#b91c1c" : (isNoctua ? "#1f120c" : (isArgb ? "#0284c7" : "#0f172a"));
  const bladeEmissiveIntensity = highlight ? 0.8 : (isArgb ? 0.5 : 0.15);
  const badgeColor = highlight ? "#fca5a5" : (isNoctua ? "#c8a46b" : "#38bdf8");
  const edgeColor = highlight ? "#fca5a5" : (isNoctua ? "#bfb192" : "#475569");

  // Spin rotor smoothly around local Z axis
  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += delta * 6.5;
    }
  });

  return (
    <group
      name={component?.id ?? "fan-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale ?? [1, 1, 1]}
    >
      {/* 1. Main Square Fan Housing Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, thick]} />
        <meshStandardMaterial
          color={frameColor}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.85 : 0}
          metalness={isNoctua ? 0.15 : 0.45}
          roughness={isNoctua ? 0.65 : 0.5}
        />
        <Edges color={edgeColor} threshold={15} />
      </mesh>

      {/* 4 Anti-Vibration Corner Rubber Pads */}
      <mesh position={[-holeOffset, -holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={padColor} roughness={0.9} />
      </mesh>
      <mesh position={[holeOffset, -holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={padColor} roughness={0.9} />
      </mesh>
      <mesh position={[-holeOffset, holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={padColor} roughness={0.9} />
      </mesh>
      <mesh position={[holeOffset, holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={padColor} roughness={0.9} />
      </mesh>

      {/* 4 Corner Screw Holes (aligned with Z axis) */}
      <mesh position={[-holeOffset, -holeOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, thick * 1.08, 8]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      <mesh position={[holeOffset, -holeOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, thick * 1.08, 8]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      <mesh position={[-holeOffset, holeOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, thick * 1.08, 8]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      <mesh position={[holeOffset, holeOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, thick * 1.08, 8]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* Circular Tunnel Intake Stator (aligned with Z axis) */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[size * 0.46, size * 0.46, thick * 1.02, 28]} />
        <meshStandardMaterial color={statorColor} roughness={0.7} />
      </mesh>

      {/* 4 Structural Rear Stator Support Struts */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(angle) * size * 0.25, Math.sin(angle) * size * 0.25, -thick * 0.42]}
          rotation={[0, 0, angle]}
        >
          <boxGeometry args={[size * 0.44, 0.06, 0.05]} />
          <meshStandardMaterial color={hubColor} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Animated Spinning Impeller Rotor Assembly (spins in X-Y plane around Z) */}
      <group ref={rotorRef} position={[0, 0, 0]}>
        {/* Central Motor Hub Cylinder (aligned with Z axis) */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[size * 0.18, size * 0.18, thick * 0.75, 20]} />
          <meshStandardMaterial
            color={hubColor}
            metalness={isNoctua ? 0.3 : 0.75}
            roughness={isNoctua ? 0.6 : 0.25}
          />
        </mesh>

        {/* Center Badge (aligned with Z axis) */}
        <mesh position={[0, 0, thick * 0.39]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.14, size * 0.14, 0.04, 20]} />
          <meshStandardMaterial
            color={badgeColor}
            emissive={badgeColor}
            emissiveIntensity={highlight ? 0.9 : (isArgb ? 0.4 : 0.15)}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* 9 Aerodynamic Swept Impeller Blades (sweep in X-Y plane around Z) */}
        {Array.from({ length: 9 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 9;
          const bladeLen = size * 0.26;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * (size * 0.18 + bladeLen * 0.45), Math.sin(angle) * (size * 0.18 + bladeLen * 0.45), 0]}
              rotation={[0, 0.3, angle + 0.4]}
            >
              <boxGeometry args={[bladeLen, size * 0.09, 0.04]} />
              <meshStandardMaterial
                color={bladeColor}
                emissive={bladeEmissive}
                emissiveIntensity={bladeEmissiveIntensity}
                metalness={isNoctua ? 0.15 : 0.25}
                roughness={isNoctua ? 0.45 : 0.3}
              />
            </mesh>
          );
        })}
      </group>

      {/* ARGB Glow Ring (only on ARGB fans) */}
      {isArgb && (
        <mesh position={[0, 0, thick * 0.51]}>
          <ringGeometry args={[size * 0.44, size * 0.47, 32]} />
          <meshBasicMaterial
            color={highlight ? "#ef4444" : "#38bdf8"}
            opacity={highlight ? 0.95 : 0.75}
            transparent
          />
        </mesh>
      )}
    </group>
  );
}