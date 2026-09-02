import { useMemo } from "react";
import { Edges } from "@react-three/drei";
import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import type { CaseProfile } from "../../domain/cases/types";
import { GlbAsset, preloadGlb } from "./GlbAsset";

export const CASE_LIAN_LI_GLB_URL = "/assets/case-lian-li-lancool-216/lod0.glb";
preloadGlb(CASE_LIAN_LI_GLB_URL);

/** Palette — R1 Neutral Grey Hierarchy (P3)
 * Main shell:      #AEB3BA → #BCC1C8
 * Frame/interior:  #747B84 → #858C95
 * Edge/accent:     #545B64 → #646B74
 * Glass:           cool transparent grey #C2C8D0
 * metalness 0.35–0.65, roughness 0.35–0.6, no pure black, no mirror chrome
 */

/** 1. MINI_PC: Compact Mini-ITX Cube (190 x 200 x 200 mm -> 3.8 x 4.0 x 4.0 units) */
function MiniPcChassisStructure({ profile }: { profile: CaseProfile }) {
  return (
    <group name="mini-pc-chassis">
      {/* Outer Cage Wireframe Envelope — subtle neutral */}
      <mesh position={[0, 2.0, 0]} receiveShadow>
        <boxGeometry args={[3.8, 4.0, 4.0]} />
        <meshStandardMaterial color="#BCC1C8" opacity={0.10} transparent wireframe />
      </mesh>

      {/* Frame Posts (4 corner pillars) — accent */}
      <mesh position={[-1.85, 2.0, -1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#5E656F" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[1.85, 2.0, -1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#5E656F" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[-1.85, 2.0, 1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#5E656F" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[1.85, 2.0, 1.95]}>
        <boxGeometry args={[0.15, 3.9, 0.15]} />
        <meshStandardMaterial color="#5E656F" metalness={0.45} roughness={0.45} />
      </mesh>

      {/* Bottom Floor & Mini PSU Cradle — interior */}
      <mesh position={[0.7, 0.8, 0]} receiveShadow>
        <boxGeometry args={[1.8, 1.4, 2.4]} />
        <meshStandardMaterial color="#858C95" metalness={0.42} roughness={0.52} />
      </mesh>

      {/* Mini-ITX Motherboard Tray Plate */}
      <mesh position={[-1.1, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.08, 3.2, 3.2]} />
        <meshStandardMaterial color="#AEB3BA" metalness={0.38} roughness={0.42} />
        <Edges color="#8A919C" threshold={20} />
      </mesh>

      {/* Front Hex-Mesh Intake Grille */}
      <mesh position={[0, 2.0, 1.95]}>
        <boxGeometry args={[3.6, 3.7, 0.08]} />
        <meshStandardMaterial color="#646B74" metalness={0.55} roughness={0.45} wireframe />
      </mesh>

      {/* Top Exhaust Vent Plate */}
      <mesh position={[0, 3.95, 0]}>
        <boxGeometry args={[3.6, 0.08, 3.8]} />
        <meshStandardMaterial color="#747B84" metalness={0.48} roughness={0.5} wireframe />
      </mesh>

      {/* Left Side — cool transparent grey */}
      <mesh position={[1.88, 2.0, 0]}>
        <boxGeometry args={[0.04, 3.7, 3.7]} />
        <meshStandardMaterial color="#C2C8D0" opacity={0.14} transparent roughness={0.35} metalness={0.15} />
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
        <meshStandardMaterial color="#BCC1C8" opacity={0.08} transparent wireframe />
      </mesh>

      {/* Main Structural Beams — accent */}
      <mesh position={[-2.0, 3.5, -3.3]}>
        <boxGeometry args={[0.18, 6.9, 0.18]} />
        <meshStandardMaterial color="#5A616B" metalness={0.48} roughness={0.44} />
      </mesh>
      <mesh position={[2.0, 3.5, -3.3]}>
        <boxGeometry args={[0.18, 6.9, 0.18]} />
        <meshStandardMaterial color="#5A616B" metalness={0.48} roughness={0.44} />
      </mesh>
      <mesh position={[-2.0, 3.5, 3.3]}>
        <boxGeometry args={[0.18, 6.9, 0.18]} />
        <meshStandardMaterial color="#5A616B" metalness={0.48} roughness={0.44} />
      </mesh>

      {/* Bottom PSU Basement Tunnel — main shell */}
      <mesh position={[0, 0.9, 0]} receiveShadow>
        <boxGeometry args={[4.1, 1.8, 6.6]} />
        <meshStandardMaterial color="#AEB3BA" metalness={0.40} roughness={0.48} />
        <Edges color="#8A919C" threshold={20} />
      </mesh>

      {/* Micro-ATX Motherboard Tray */}
      <mesh position={[-1.2, 4.2, 0]} receiveShadow>
        <boxGeometry args={[0.08, 4.4, 5.2]} />
        <meshStandardMaterial color="#858C95" metalness={0.42} roughness={0.50} />
        <Edges color="#7A818D" threshold={20} />
      </mesh>

      {/* Top 240mm Radiator Mounting Channel */}
      <mesh position={[0, 6.9, 0]}>
        <boxGeometry args={[3.8, 0.12, 5.8]} />
        <meshStandardMaterial color="#646B74" metalness={0.50} roughness={0.48} wireframe />
      </mesh>

      {/* Front Intake Frame */}
      <mesh position={[0, 3.5, 3.35]}>
        <boxGeometry args={[3.8, 5.6, 0.1]} />
        <meshStandardMaterial color="#5E656F" metalness={0.52} roughness={0.46} wireframe />
      </mesh>

      {/* Tempered Glass Side Panel — cool transparent */}
      <mesh position={[2.05, 3.5, 0]}>
        <boxGeometry args={[0.04, 5.6, 6.4]} />
        <meshStandardMaterial color="#C2C8D0" opacity={0.13} transparent roughness={0.38} metalness={0.12} />
      </mesh>
    </group>
  );
}

/** 3. MFF: Mid Tower Lian Li Lancool 216 (235 x 491.7 x 480.9 mm -> 4.7 x 9.834 x 9.618 units) */
function MffChassisStructure({ profile }: { profile: CaseProfile }) {
  return (
    <group name="mff-chassis">
      {/* Chassis Frame Structure — faint wire */}
      <mesh position={[0, 4.917, 0]} receiveShadow>
        <boxGeometry args={[4.7, 9.834, 9.618]} />
        <meshStandardMaterial color="#BCC1C8" opacity={0.07} transparent wireframe />
      </mesh>

      {/* 4 Corner Steel Posts — accent */}
      <mesh position={[-2.25, 4.917, -4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#5A616B" metalness={0.50} roughness={0.45} />
      </mesh>
      <mesh position={[2.25, 4.917, -4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#5A616B" metalness={0.50} roughness={0.45} />
      </mesh>
      <mesh position={[-2.25, 4.917, 4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#5A616B" metalness={0.50} roughness={0.45} />
      </mesh>
      <mesh position={[2.25, 4.917, 4.7]}>
        <boxGeometry args={[0.2, 9.6, 0.2]} />
        <meshStandardMaterial color="#5A616B" metalness={0.50} roughness={0.45} />
      </mesh>

      {/* Bottom Full-Length PSU Shroud — main shell */}
      <mesh position={[0, 1.1, 0]} receiveShadow>
        <boxGeometry args={[4.6, 2.2, 9.4]} />
        <meshStandardMaterial color="#B0B6BE" metalness={0.38} roughness={0.48} />
        <Edges color="#8E959F" threshold={20} />
      </mesh>

      {/* ATX Motherboard Tray — interior lighter than frame */}
      <mesh position={[-1.4, 5.6, 0]} receiveShadow>
        <boxGeometry args={[0.08, 6.8, 7.8]} />
        <meshStandardMaterial color="#AEB3BA" metalness={0.40} roughness={0.46} />
        <Edges color="#8A919C" threshold={20} />
      </mesh>

      {/* Front Mesh Bezel Structure */}
      <mesh position={[0, 4.917, 4.75]}>
        <boxGeometry args={[4.3, 9.6, 0.08]} />
        <meshStandardMaterial color="#646B74" metalness={0.50} roughness={0.48} wireframe />
      </mesh>

      {/* Removable Top Radiator Bracket */}
      <mesh position={[0, 9.65, 0]}>
        <boxGeometry args={[4.3, 0.12, 8.2]} />
        <meshStandardMaterial color="#747B84" metalness={0.46} roughness={0.50} wireframe />
      </mesh>

      {/* Full Tempered Glass Panel */}
      <mesh position={[2.32, 4.917, 0]}>
        <boxGeometry args={[0.05, 9.6, 9.4]} />
        <meshStandardMaterial color="#C9D0D8" opacity={0.12} transparent roughness={0.38} metalness={0.10} />
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
        <meshStandardMaterial color="#BCC1C8" opacity={0.07} transparent wireframe />
      </mesh>

      {/* Industrial Pillars — accent slightly darker for depth */}
      <mesh position={[-2.6, 5.6, -5.6]}>
        <boxGeometry args={[0.25, 11.0, 0.25]} />
        <meshStandardMaterial color="#545B64" metalness={0.52} roughness={0.42} />
      </mesh>
      <mesh position={[2.6, 5.6, -5.6]}>
        <boxGeometry args={[0.25, 11.0, 0.25]} />
        <meshStandardMaterial color="#545B64" metalness={0.52} roughness={0.42} />
      </mesh>
      <mesh position={[-2.6, 5.6, 5.6]}>
        <boxGeometry args={[0.25, 11.0, 0.25]} />
        <meshStandardMaterial color="#545B64" metalness={0.52} roughness={0.42} />
      </mesh>

      {/* E-ATX Reinforced Motherboard Backplate */}
      <mesh position={[-1.6, 6.3, 0]} receiveShadow>
        <boxGeometry args={[0.1, 8.4, 9.4]} />
        <meshStandardMaterial color="#AEB3BA" metalness={0.40} roughness={0.48} />
        <Edges color="#8A919C" threshold={20} />
      </mesh>

      {/* Bottom Dual-Chamber PSU Basement */}
      <mesh position={[0, 1.2, 0]} receiveShadow>
        <boxGeometry args={[5.2, 2.4, 11.2]} />
        <meshStandardMaterial color="#B0B6BE" metalness={0.38} roughness={0.50} />
        <Edges color="#8E959F" threshold={20} />
      </mesh>

      {/* Front Bezel Bracket Frame */}
      <mesh position={[0, 5.6, 5.75]}>
        <boxGeometry args={[4.8, 10.6, 0.12]} />
        <meshStandardMaterial color="#646B74" metalness={0.48} roughness={0.50} wireframe />
      </mesh>

      {/* Top Push-Pull 480mm Liquid Cooling Bay */}
      <mesh position={[0, 11.0, 0]}>
        <boxGeometry args={[4.8, 0.18, 10.4]} />
        <meshStandardMaterial color="#747B84" metalness={0.45} roughness={0.52} wireframe />
      </mesh>

      {/* Dual Tempered Glass Side Panel */}
      <mesh position={[2.65, 5.6, 0]}>
        <boxGeometry args={[0.06, 10.8, 11.0]} />
        <meshStandardMaterial color="#C2C8D0" opacity={0.12} transparent roughness={0.36} metalness={0.10} />
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
