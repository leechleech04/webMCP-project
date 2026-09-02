import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import type { SceneTransform } from "../../scene/mountTransforms";
import type { ComponentDefinition } from "../../domain/types/component";
import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import { getRadiatorLayout } from "../../scene/radiatorLayout";

export interface RadiatorModelProps {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}

const DEFAULT_RADIATOR_DIMENSIONS = {
  width: 120,
  height: 30,
  depth: 397,
};

export function RadiatorModel({ transform, highlight = false, component }: RadiatorModelProps) {
  const fanGroupRef = useRef<THREE.Group>(null);
  const state = useBuildStore((s) => s);
  const activeProfile = useMemo(() => getActiveCaseProfile(state), [state]);

  const {
    width: radWidth,
    length: radLength,
    thickness: radThick,
    fanCount,
    fanSize,
    fanOffsets,
  } = useMemo(
    () => getRadiatorLayout(component?.dimensions ?? DEFAULT_RADIATOR_DIMENSIONS),
    [
      component?.dimensions.depth,
      component?.dimensions.height,
      component?.dimensions.width,
    ],
  );

  // Spin radiator cooling fan rotors (only internal blades spin, outer square frame stays static)
  useFrame((_, delta) => {
    if (fanGroupRef.current) {
      fanGroupRef.current.children.forEach((fan) => {
        const rotor = fan.getObjectByName("radiator-fan-rotor");
        if (rotor) {
          rotor.rotation.z += delta * 6.5;
        }
      });
    }
  });

  const isTopMount = Math.abs(transform.rotation[0] - Math.PI / 2) < 0.1;

  // Convert the CPU socket's world transform into radiator-local space. This
  // keeps the pump and tube endpoints correct for both front and top mounts.
  const { pumpRelPos, pumpRelRotation, pumpPort1, pumpPort2 } = useMemo(() => {
    const cpuTransform = activeProfile.mountTransforms["cpu-socket-1"] ?? {
      position: [-1.0, 6.1, -0.6] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
    };
    const radiatorPosition = new THREE.Vector3(...transform.position);
    const radiatorQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...transform.rotation, "XYZ"),
    );
    const inverseRadiatorQuaternion = radiatorQuaternion.clone().invert();
    const localPosition = new THREE.Vector3(...cpuTransform.position)
      .sub(radiatorPosition)
      .applyQuaternion(inverseRadiatorQuaternion);
    const cpuWorldQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...cpuTransform.rotation, "XYZ"),
    );
    const localQuaternion = inverseRadiatorQuaternion
      .clone()
      .multiply(cpuWorldQuaternion);
    const localRotation = new THREE.Euler().setFromQuaternion(
      localQuaternion,
      "XYZ",
    );

    const toRadiatorLocalPort = (offset: THREE.Vector3): THREE.Vector3 =>
      offset.applyQuaternion(localQuaternion).add(localPosition);

    return {
      pumpRelPos: localPosition.toArray() as [number, number, number],
      pumpRelRotation: [
        localRotation.x,
        localRotation.y,
        localRotation.z,
      ] as [number, number, number],
      pumpPort1: toRadiatorLocalPort(new THREE.Vector3(0.35, 0.2, 0.35)),
      pumpPort2: toRadiatorLocalPort(new THREE.Vector3(-0.35, -0.2, 0.35)),
    };
  }, [
    activeProfile,
    transform.position[0],
    transform.position[1],
    transform.position[2],
    transform.rotation[0],
    transform.rotation[1],
    transform.rotation[2],
  ]);

  // Curved braided coolant tubes (Inlet & Outlet)
  const [tube1Geometry, tube2Geometry] = useMemo(() => {
    const radPort1 = new THREE.Vector3(radWidth * 0.28, -radLength * 0.42, radThick * 0.55);
    const radPort2 = new THREE.Vector3(-radWidth * 0.28, -radLength * 0.42, radThick * 0.55);

    const mid1 = new THREE.Vector3(
      (radPort1.x + pumpPort1.x) * 0.5 + (isTopMount ? 0.3 : 0.5),
      (radPort1.y + pumpPort1.y) * 0.5 - 0.4,
      (radPort1.z + pumpPort1.z) * 0.5 + 0.6
    );
    const mid2 = new THREE.Vector3(
      (radPort2.x + pumpPort2.x) * 0.5 - (isTopMount ? 0.3 : 0.5),
      (radPort2.y + pumpPort2.y) * 0.5 - 0.6,
      (radPort2.z + pumpPort2.z) * 0.5 + 0.4
    );

    const curve1 = new THREE.CatmullRomCurve3([radPort1, mid1, pumpPort1]);
    const curve2 = new THREE.CatmullRomCurve3([radPort2, mid2, pumpPort2]);

    const geom1 = new THREE.TubeGeometry(curve1, 32, 0.12, 10, false);
    const geom2 = new THREE.TubeGeometry(curve2, 32, 0.12, 10, false);

    return [geom1, geom2];
  }, [radLength, radWidth, radThick, pumpPort1, pumpPort2, isTopMount]);

  useEffect(
    () => () => {
      tube1Geometry.dispose();
      tube2Geometry.dispose();
    },
    [tube1Geometry, tube2Geometry],
  );

  return (
    <group
      name={component?.id ?? "radiator-aio-model"}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale ?? [1, 1, 1]}
    >
      {/* 1. Radiator Aluminum Tank Core Housing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[radWidth, radLength, radThick]} />
        <meshStandardMaterial
          color={highlight ? "#dc2626" : "#0f172a"}
          emissive={highlight ? "#ef4444" : "#000000"}
          emissiveIntensity={highlight ? 0.9 : 0}
          metalness={0.75}
          roughness={0.25}
        />
        <Edges color={highlight ? "#fca5a5" : "#38bdf8"} threshold={15} />
      </mesh>

      {/* High-Density Fin Matrix */}
      <mesh position={[0, 0, radThick * 0.51]}>
        <boxGeometry args={[radWidth * 0.88, radLength * 0.92, 0.04]} />
        <meshStandardMaterial
          color={highlight ? "#ef4444" : "#0284c7"}
          metalness={0.9}
          roughness={0.1}
          wireframe
        />
      </mesh>

      {/* 2. Integrated Radiator PWM Aerodynamic Fans */}
      <group ref={fanGroupRef} position={[0, 0, radThick * 0.5 + 0.25]}>
        {Array.from({ length: fanCount }).map((_, idx) => {
          const fanThick = 0.5; // 25mm fan thickness
          const holeOffset = fanSize * 0.42;
          const fanOffsetY = fanOffsets[idx];

          return (
            <group key={idx} position={[0, fanOffsetY, 0]}>
              {/* Open fan frame: four rails preserve the silhouette without hiding the rotor. */}
              <mesh castShadow receiveShadow position={[0, fanSize * 0.45, 0]}>
                <boxGeometry args={[fanSize, fanSize * 0.1, fanThick]} />
                <meshStandardMaterial
                  color={highlight ? "#dc2626" : "#1e293b"}
                  emissive={highlight ? "#ef4444" : "#000000"}
                  emissiveIntensity={highlight ? 0.85 : 0}
                  metalness={0.5}
                  roughness={0.5}
                />
                <Edges color={highlight ? "#fca5a5" : "#64748b"} threshold={15} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, -fanSize * 0.45, 0]}>
                <boxGeometry args={[fanSize, fanSize * 0.1, fanThick]} />
                <meshStandardMaterial color={highlight ? "#dc2626" : "#1e293b"} metalness={0.5} roughness={0.5} />
              </mesh>
              <mesh castShadow receiveShadow position={[fanSize * 0.45, 0, 0]}>
                <boxGeometry args={[fanSize * 0.1, fanSize * 0.8, fanThick]} />
                <meshStandardMaterial color={highlight ? "#dc2626" : "#1e293b"} metalness={0.5} roughness={0.5} />
              </mesh>
              <mesh castShadow receiveShadow position={[-fanSize * 0.45, 0, 0]}>
                <boxGeometry args={[fanSize * 0.1, fanSize * 0.8, fanThick]} />
                <meshStandardMaterial color={highlight ? "#dc2626" : "#1e293b"} metalness={0.5} roughness={0.5} />
              </mesh>

              {/* 4 Corner Rubber Anti-Vibration Dampers */}
              <mesh position={[-holeOffset, -holeOffset, 0]}>
                <boxGeometry args={[fanSize * 0.18, fanSize * 0.18, fanThick * 1.04]} />
                <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
              </mesh>
              <mesh position={[holeOffset, -holeOffset, 0]}>
                <boxGeometry args={[fanSize * 0.18, fanSize * 0.18, fanThick * 1.04]} />
                <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
              </mesh>
              <mesh position={[-holeOffset, holeOffset, 0]}>
                <boxGeometry args={[fanSize * 0.18, fanSize * 0.18, fanThick * 1.04]} />
                <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
              </mesh>
              <mesh position={[holeOffset, holeOffset, 0]}>
                <boxGeometry args={[fanSize * 0.18, fanSize * 0.18, fanThick * 1.04]} />
                <meshStandardMaterial color={highlight ? "#991b1b" : "#0f172a"} roughness={0.9} />
              </mesh>

              {/* Circular tunnel lip in the same X-Y plane as the rotor. */}
              <mesh position={[0, 0, 0]}>
                <torusGeometry args={[fanSize * 0.41, fanSize * 0.045, 8, 32]} />
                <meshStandardMaterial color="#0b1120" roughness={0.7} />
              </mesh>

              {/* Spinning Impeller Rotor Assembly (spins in X-Y plane around Z) */}
              <group name="radiator-fan-rotor" position={[0, 0, 0]}>
                {/* Center Motor Hub Cylinder (aligned with Z axis) */}
                <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[fanSize * 0.18, fanSize * 0.18, fanThick * 0.75, 20]} />
                  <meshStandardMaterial
                    color={highlight ? "#b91c1c" : "#1e293b"}
                    metalness={0.75}
                    roughness={0.25}
                  />
                </mesh>

                {/* Metallic Center Logo Badge (aligned with Z axis) */}
                <mesh position={[0, 0, fanThick * 0.39]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[fanSize * 0.14, fanSize * 0.14, 0.04, 20]} />
                  <meshStandardMaterial
                    color={highlight ? "#fca5a5" : "#38bdf8"}
                    emissive={highlight ? "#ef4444" : "#0284c7"}
                    emissiveIntensity={highlight ? 0.9 : 0.5}
                    metalness={0.9}
                    roughness={0.1}
                  />
                </mesh>

                {/* 9 Aerodynamic Swept Impeller Blades */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const angle = (i * Math.PI * 2) / 9;
                  const bladeLen = fanSize * 0.26;
                  return (
                    <mesh
                      key={i}
                      position={[
                        Math.cos(angle) * (fanSize * 0.18 + bladeLen * 0.45),
                        Math.sin(angle) * (fanSize * 0.18 + bladeLen * 0.45),
                        0,
                      ]}
                      rotation={[0, 0.3, angle + 0.4]}
                    >
                      <boxGeometry args={[bladeLen, fanSize * 0.09, 0.04]} />
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

              {/* Vibrant ARGB Glowing Halo Ring */}
              <mesh position={[0, 0, fanThick * 0.51]}>
                <ringGeometry args={[fanSize * 0.44, fanSize * 0.47, 32]} />
                <meshBasicMaterial
                  color={highlight ? "#ef4444" : "#38bdf8"}
                  opacity={highlight ? 0.95 : 0.75}
                  transparent
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 3. Radiator Rotary Hose Fittings */}
      <mesh position={[radWidth * 0.28, -radLength * 0.42, radThick * 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-radWidth * 0.28, -radLength * 0.42, radThick * 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 4. Flexible Braided Coolant Tubes (Inlet & Outlet) */}
      <mesh geometry={tube1Geometry} castShadow>
        <meshStandardMaterial
          color={highlight ? "#ef4444" : "#1e1b4b"}
          metalness={0.4}
          roughness={0.7}
        />
      </mesh>
      <mesh geometry={tube2Geometry} castShadow>
        <meshStandardMaterial
          color={highlight ? "#ef4444" : "#1e1b4b"}
          metalness={0.4}
          roughness={0.7}
        />
      </mesh>

      {/* 5. CPU Water Block & Pump Unit (Attached directly over CPU socket) */}
      <group position={pumpRelPos} rotation={pumpRelRotation}>
        {/* Micro-skived Copper Cold Plate */}
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#b45309" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Ceramic Pump Housing Cylinder */}
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.75, 0.75, 0.65, 24]} />
          <meshStandardMaterial
            color={highlight ? "#dc2626" : "#0f172a"}
            emissive={highlight ? "#ef4444" : "#000000"}
            emissiveIntensity={highlight ? 0.9 : 0}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* RGB Infinity Mirror Top Cap */}
        <mesh position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.65, 0.65, 0.08, 24]} />
          <meshStandardMaterial
            color={highlight ? "#ef4444" : "#0284c7"}
            emissive={highlight ? "#dc2626" : "#38bdf8"}
            emissiveIntensity={highlight ? 0.95 : 0.85}
            roughness={0.1}
          />
        </mesh>

        {/* 90-Degree Swivel Pump Fittings */}
        <mesh position={[0.35, 0.2, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.2, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.35, -0.2, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.2, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
