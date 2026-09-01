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
          color={highlight ? "#dc2626" : "#1e293b"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.85 : 0}
          metalness={0.5}
          roughness={0.5}
        />
        <Edges color={highlight ? "#fca5a5" : "#64748b"} threshold={15} />
      </mesh>

      {/* 4 Anti-Vibration Corner Rubber Pads */}
      <mesh position={[-holeOffset, -holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
      </mesh>
      <mesh position={[holeOffset, -holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
      </mesh>
      <mesh position={[-holeOffset, holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
      </mesh>
      <mesh position={[holeOffset, holeOffset, 0]}>
        <boxGeometry args={[size * 0.18, size * 0.18, thick * 1.04]} />
        <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
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
        <meshStandardMaterial color="#0b1120" roughness={0.7} />
      </mesh>

      {/* 4 Structural Rear Stator Support Struts */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(angle) * size * 0.25, Math.sin(angle) * size * 0.25, -thick * 0.42]}
          rotation={[0, 0, angle]}
        >
          <boxGeometry args={[size * 0.44, 0.06, 0.05]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Animated Spinning Impeller Rotor Assembly (spins in X-Y plane around Z) */}
      <group ref={rotorRef} position={[0, 0, 0]}>
        {/* Central Motor Hub Cylinder (aligned with Z axis) */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[size * 0.18, size * 0.18, thick * 0.75, 20]} />
          <meshStandardMaterial
            color={highlight ? "#b91c1c" : "#1e293b"}
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>

        {/* Metallic Center Badge (aligned with Z axis) */}
        <mesh position={[0, 0, thick * 0.39]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.14, size * 0.14, 0.04, 20]} />
          <meshStandardMaterial
            color={highlight ? "#fca5a5" : "#38bdf8"}
            emissive={highlight ? "#ef4444" : "#0284c7"}
            emissiveIntensity={highlight ? 0.9 : 0.4}
            metalness={0.9}
            roughness={0.1}
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
                color={highlight ? "#ef4444" : "#0284c7"}
                emissive={highlight ? "#b91c1c" : "#0369a1"}
                emissiveIntensity={highlight ? 0.6 : 0.25}
                metalness={0.2}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>

      {/* ARGB Glow Ring */}
      <mesh position={[0, 0, thick * 0.51]}>
        <ringGeometry args={[size * 0.44, size * 0.47, 32]} />
        <meshBasicMaterial
          color={highlight ? "#ef4444" : "#38bdf8"}
          opacity={highlight ? 0.95 : 0.75}
          transparent
        />
      </mesh>
    </group>
  );
}