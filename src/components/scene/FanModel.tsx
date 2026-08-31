import { Edges } from "@react-three/drei";

import type { SceneTransform } from "../../scene/mountTransforms";
import { GlbAsset, preloadGlb } from "./GlbAsset";

export const FAN_NOCTUA_GLB_URL = "/assets/fan-noctua-nf-a12x25-g2-pwm/lod0.glb";

preloadGlb(FAN_NOCTUA_GLB_URL);

export interface FanModelProps {
  transform: SceneTransform;
  highlight?: boolean;
}

function ProceduralFan({ highlight = false }: { highlight?: boolean }) {
  return (
    <group name="fan-top-01-procedural-fallback">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.28, 1.45]} />
        <meshStandardMaterial color={highlight ? "#ef4444" : "#a16207"} emissive={highlight ? "#7f1d1d" : "#000000"} emissiveIntensity={highlight ? 0.65 : 0} />
        <Edges color={highlight ? "#fecaca" : "#fbbf24"} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 16]} />
        <meshStandardMaterial color="#422006" />
      </mesh>
    </group>
  );
}

export function FanModel({ transform, highlight = false }: FanModelProps) {
  return (
    <group
      name="fan-top-01"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <GlbAsset
        url={FAN_NOCTUA_GLB_URL}
        fallback={<ProceduralFan highlight={highlight} />}
      />
    </group>
  );
}
