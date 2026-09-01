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
        const color = c.isValidSnap ? (isHovered ? "#22c55e" : "#3b82f6") : "#ef4444";

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
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color={color} transparent opacity={c.isValidSnap ? 0.75 : 0.3} />
          </mesh>
        );
      })}
    </group>
  );
}
