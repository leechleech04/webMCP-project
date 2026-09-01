import { useMemo } from "react";
import { Edges } from "@react-three/drei";
import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import type { CaseProfile } from "../../domain/cases/types";
import { GlbAsset, preloadGlb } from "./GlbAsset";

export const CASE_LIAN_LI_GLB_URL = "/assets/case-lian-li-lancool-216/lod0.glb";
preloadGlb(CASE_LIAN_LI_GLB_URL);

/** 1. MINI_PC: Compact Mini-ITX Cube (190 x 200 x 200 mm -> 3.8 x 4.0 x 4.0 units) */
function MiniPcChassisStructure({ profile }: { profile: CaseProfile }) {
  return (
    <group name="mini-pc-chassis">
      {/* Outer Cage Wireframe Envelope */}
      <mesh position={[0, 2.0, 0]} receiveShadow>
        <boxGeometry args={[3.8, 4.0, 4.0]} />
        <meshStandardMaterial color="#38bdf8" opacity={0.14} transparent wireframe />
      </mesh>

      {/* Frame Posts (4 corner pillars) */}
      <mesh position={[-1.85, 2.0, -1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.85, 2.0, -1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.85, 2.0, 1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.85, 2.0, 1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bottom Floor & Mini PSU Cradle */}
      <mesh position={[0.7, 0.8, 0]} receiveShadow>
        <boxGeometry args={[1.8, 1.4, 2.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Mini-ITX Motherboard Tray Plate */}
      <mesh position={[-1.1, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.08, 3.2, 3.2]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
        <Edges color="#60a5fa" threshold={20} />
      </mesh>

      {/* Front Hex-Mesh Intake Grille */}
      <mesh position={[0, 2.0, 1.95]}>
        <boxGeometry args={[3.6, 3.7, 0.08]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.3} wireframe />
      </mesh>

      {/* Top Exhaust Vent Plate */}
      <mesh position={[0, 3.95, 0]}>
        <boxGeometry args={[3.6, 0.08, 3.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} wireframe />
      </mesh>

      {/* Left Acrylic Side Window */}
      <mesh position={[1.88, 2.0, 0]}>
        <boxGeometry args={[0.04, 3.7, 3.7]} />
        <meshStandardMaterial color="#0ea5e9" opacity={0.22} transparent roughness={0.1} />
      </mesh>
    </group>
  );
}

/** 2. SFF: Mini Tower Micro-ATX (210 x 350 x 340 mm -> 4.2 x 7.0 x 6.8 units) */
function SffChassisStructure({ profile }: { profile: CaseProfile }) {
  return (
    <group name="sff-chassis">
      {/* Outer Envelope */}
      <mesh position={[0, 3.5, 0]} receiveShadow>
        <boxGeometry args={[4.2, 7.0, 6.8]} />
        <meshStandardMaterial color="#64748b" opacity={0.12} transparent wireframe />
      </mesh>

      {/* Main Structural Beams */}
      <mesh position={[-2.0, 3.5, -3.3]}>
        <boxGeometry args={[0.18, 6.9, 0.18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[2.0, 3.5, -3.3]}>
        <boxGeometry args={[0.18, 6.9, 0.18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-2.0, 3.5, 3.3]}>
        <boxGeometry args={[0.18, 6.9, 0.18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bottom PSU Basement Tunnel */}
      <mesh position={[0, 0.9, 0]} receiveShadow>
        <boxGeometry args={[4.1, 1.8, 6.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        <Edges color="#475569" threshold={20} />
      </mesh>

      {/* Micro-ATX Motherboard Tray */}
      <mesh position={[-1.2, 4.2, 0]} receiveShadow>
        <boxGeometry args={[0.08, 4.4, 5.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        <Edges color="#38bdf8" threshold={20} />
      </mesh>

      {/* Top 240mm Radiator Mounting Channel */}
      <mesh position={[0, 6.9, 0]}>
        <boxGeometry args={[3.8, 0.12, 5.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} wireframe />
      </mesh>

      {/* Front Intake Frame */}
      <mesh position={[0, 3.5, 3.35]}>
        <boxGeometry args={[3.8, 5.6, 0.1]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} wireframe />
      </mesh>

      {/* Tinted Tempered Glass Side Panel */}
      <mesh position={[2.05, 3.5, 0]}>
        <boxGeometry args={[0.04, 5.6, 6.4]} />
        <meshStandardMaterial color="#1e293b" opacity={0.32} transparent roughness={0.1} />
      </mesh>
    </group>
  );
}

/** 3. MFF: Mid Tower Lian Li Lancool 216 (235 x 491.7 x 480.9 mm -> 4.7 x 9.834 x 9.618 units) */
function MffChassisStructure({ profile }: { profile: CaseProfile }) {
  return (
    <group name="mff-chassis">
      {/* Chassis Frame Structure */}
      <mesh position={[0, 4.917, 0]} receiveShadow>
        <boxGeometry args={[4.7, 9.834, 9.618]} />
        <meshStandardMaterial color="#3b82f6" opacity={0.1} transparent wireframe />
      </mesh>

      {/* 4 Corner Steel Posts */}
      <mesh position={[-2.25, 4.917, -4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[2.25, 4.917, -4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-2.25, 4.917, 4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[2.25, 4.917, 4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bottom Full-Length PSU Shroud */}
      <mesh position={[0, 1.1, 0]} receiveShadow>
        <boxGeometry args={[4.6, 2.2, 9.4]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.4} />
        <Edges color="#374151" threshold={20} />
      </mesh>

      {/* ATX Motherboard Tray & Cable Pass-Throughs */}
      <mesh position={[-1.4, 5.6, 0]} receiveShadow>
        <boxGeometry args={[0.08, 6.8, 7.8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.5} />
        <Edges color="#60a5fa" threshold={20} />
      </mesh>

      {/* Front Mesh Bezel Structure */}
      <mesh position={[0, 4.917, 4.75]}>
        <boxGeometry args={[4.3, 9.6, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} wireframe />
      </mesh>

      {/* Removable Top Radiator Bracket */}
      <mesh position={[0, 9.65, 0]}>
        <boxGeometry args={[4.3, 0.12, 8.2]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} wireframe />
      </mesh>

      {/* Full Tempered Glass Panel */}
      <mesh position={[2.32, 4.917, 0]}>
        <boxGeometry args={[0.05, 9.6, 9.4]} />
        <meshStandardMaterial color="#0f172a" opacity={0.28} transparent roughness={0.08} />
      </mesh>
    </group>
  );
}

/** 4. LFF: Massive Full Tower Chassis (270 x 560 x 580 mm -> 5.4 x 11.2 x 11.6 units) */
function LffChassisStructure({ profile }: { profile: CaseProfile }) {
  return (
    <group name="lff-chassis">
      {/* Massive Outer Frame */}
      <mesh position={[0, 5.6, 0]} receiveShadow>
        <boxGeometry args={[5.4, 11.2, 11.6]} />
        <meshStandardMaterial color="#818cf8" opacity={0.12} transparent wireframe />
      </mesh>

      {/* Industrial Heavy-Duty Pillars */}
      <mesh position={[-2.6, 5.6, -5.6]}>
        <boxGeometry args={[0.25, 11.0, 0.25]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[2.6, 5.6, -5.6]}>
        <boxGeometry args={[0.25, 11.0, 0.25]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[-2.6, 5.6, 5.6]}>
        <boxGeometry args={[0.25, 11.0, 0.25]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* E-ATX Reinforced Motherboard Backplate */}
      <mesh position={[-1.6, 6.3, 0]} receiveShadow>
        <boxGeometry args={[0.1, 8.4, 9.4]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.65} roughness={0.4} />
        <Edges color="#818cf8" threshold={20} />
      </mesh>

      {/* Bottom Dual-Chamber PSU Basement */}
      <mesh position={[0, 1.2, 0]} receiveShadow>
        <boxGeometry args={[5.2, 2.4, 11.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
        <Edges color="#312e81" threshold={20} />
      </mesh>

      {/* Front Bezel Bracket Frame */}
      <mesh position={[0, 5.6, 5.75]}>
        <boxGeometry args={[4.8, 10.6, 0.12]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.2} wireframe />
      </mesh>

      {/* Top Push-Pull 480mm Liquid Cooling Bay */}
      <mesh position={[0, 11.0, 0]}>
        <boxGeometry args={[4.8, 0.18, 10.4]} />
        <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.25} wireframe />
      </mesh>

      {/* Dual Tempered Glass Side Panel */}
      <mesh position={[2.65, 5.6, 0]}>
        <boxGeometry args={[0.06, 10.8, 11.0]} />
        <meshStandardMaterial color="#1e1b4b" opacity={0.25} transparent roughness={0.05} />
      </mesh>
    </group>
  );
}

export function CaseModel() {
  const state = useBuildStore((s) => s);
  const activeProfile = useMemo(() => getActiveCaseProfile(state), [state]);

  return (
    <group name="case" position={[0, 0, 0]}>
      {activeProfile.id === "case-profile-mini-pc" && <MiniPcChassisStructure profile={activeProfile} />}
      {activeProfile.id === "case-sff-01" && <SffChassisStructure profile={activeProfile} />}
      {activeProfile.id === "case-profile-sff" && <SffChassisStructure profile={activeProfile} />}
      {activeProfile.id === "case-01" && <MffChassisStructure profile={activeProfile} />}
      {activeProfile.id === "case-profile-mff" && <MffChassisStructure profile={activeProfile} />}
      {activeProfile.id === "case-lff-01" && <LffChassisStructure profile={activeProfile} />}
      {activeProfile.id === "case-profile-lff" && <LffChassisStructure profile={activeProfile} />}
    </group>
  );
}