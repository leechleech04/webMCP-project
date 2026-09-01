import * as THREE from "three";
import type { AirflowScene } from "../../domain/airflow/types";

export interface AirflowVisualizationProps {
  airflow: AirflowScene;
  enabled?: boolean;
}

export function AirflowVisualization({ airflow, enabled = true }: AirflowVisualizationProps) {
  if (!enabled || airflow.streams.length === 0) return null;

  return (
    <group name="airflow-visualization">
      {airflow.streams.map((stream) => (
        <group key={stream.id}>
          {/* Start Flow Origin Indicator */}
          <mesh position={stream.start}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial
              color={stream.color}
              emissive={stream.color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Directed Airflow Cone at Stream Endpoint */}
          <mesh position={stream.end}>
            <coneGeometry args={[0.24, 0.55, 16]} />
            <meshStandardMaterial
              color={stream.color}
              emissive={stream.color}
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
