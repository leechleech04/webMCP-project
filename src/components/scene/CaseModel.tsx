export function CaseModel() {
  return (
    <group name="case">
      <mesh position={[0, 4.5, 0]} receiveShadow>
        <boxGeometry args={[10, 9, 10]} />
        <meshStandardMaterial
          color="#334155"
          opacity={0.24}
          transparent
          wireframe
        />
      </mesh>

      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#172033" metalness={0.45} roughness={0.6} />
      </mesh>

      <mesh position={[0, 4.5, -4.9]} receiveShadow>
        <boxGeometry args={[10, 9, 0.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.35} roughness={0.72} />
      </mesh>
    </group>
  );
}
