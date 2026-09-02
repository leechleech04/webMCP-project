import type { CompatibleMountCandidate } from "../../domain/interaction/getCompatibleMounts";

export interface MountIndicatorsProps {
  mountCandidates: CompatibleMountCandidate[];
  hoveredMountId?: string | null;
  onSelectMount?: (mountId: string) => void;
}

export function MountIndicators({
  mountCandidates,
  hoveredMountId,
  onSelectMount,
}: MountIndicatorsProps) {
  return (
    <group name="mount-indicators">
      {mountCandidates.map((c) => {
        const isHovered = hoveredMountId === c.mountId;
        // R1 restrained palette: muted steel blue / soft green / desaturated red
        const color = c.isValidSnap ? (isHovered ? "#7FB069" : "#6B8AD4") : "#C85A5A";

        return (
          <mesh
            key={c.mountId}
            position={c.position}
            onClick={(e) => {
              e.stopPropagation();
              if (c.isValidSnap && onSelectMount) {
                onSelectMount(c.mountId);
              }
            }}
          >
            <boxGeometry args={[0.72, 0.72, 0.72]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={c.isValidSnap ? (isHovered ? 0.62 : 0.52) : 0.26}
              roughness={0.45}
              metalness={0.22}
            />
          </mesh>
        );
      })}
    </group>
  );
}
