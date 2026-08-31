import { GlbAsset, preloadGlb } from "./GlbAsset";

export const CASE_LIAN_LI_GLB_URL =
  "/assets/case-lian-li-lancool-216/lod0.glb";

// The GLB is authored in metres. The prototype scene uses roughly 20 scene
// units per metre, producing a 4.7 x 9.834 x 9.618 unit chassis envelope.
export const CASE_SCENE_SCALE = 20;
export const CASE_SCENE_POSITION: [number, number, number] = [0, 4.917, 0];

preloadGlb(CASE_LIAN_LI_GLB_URL);

function ProceduralCaseFallback() {
  return (
    <group name="case-procedural-fallback">
      <mesh receiveShadow>
        <boxGeometry args={[4.7, 9.834, 9.618]} />
        <meshStandardMaterial
          color="#334155"
          opacity={0.24}
          transparent
          wireframe
        />
      </mesh>

      <mesh position={[0, -4.817, 0]} receiveShadow>
        <boxGeometry args={[4.7, 0.2, 9.618]} />
        <meshStandardMaterial color="#172033" metalness={0.45} roughness={0.6} />
      </mesh>

      <mesh position={[0, 0, -4.709]} receiveShadow>
        <boxGeometry args={[4.7, 9.834, 0.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.35} roughness={0.72} />
      </mesh>
    </group>
  );
}

export function CaseModel() {
  return (
    <group
      name="case"
      position={CASE_SCENE_POSITION}
      rotation={[0, Math.PI, 0]}
    >
      <GlbAsset
        url={CASE_LIAN_LI_GLB_URL}
        scale={CASE_SCENE_SCALE}
        fallback={<ProceduralCaseFallback />}
      />
    </group>
  );
}
