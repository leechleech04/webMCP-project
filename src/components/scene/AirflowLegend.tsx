import type { AirflowScene } from "../../domain/airflow/types";

export interface AirflowLegendProps {
  airflow: AirflowScene;
  enabled?: boolean;
}

export function AirflowLegend({ airflow, enabled = true }: AirflowLegendProps) {
  if (!enabled) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        padding: "0.5rem 0.75rem",
        background: "#0c1320",
        border: "1px solid #1e293b",
        borderRadius: "8px",
        fontSize: "0.76rem",
        color: "#cbd5e1",
        margin: "0.5rem 0",
      }}
    >
      <div>
        <strong>Airflow:</strong>{" "}
        <span style={{ color: "#60a5fa" }}>🔵 {airflow.intakeCount} Intake ({airflow.intakeCapacity} CFM)</span>
        {" · "}
        <span style={{ color: "#f87171" }}>🔴 {airflow.exhaustCount} Exhaust ({airflow.exhaustCapacity} CFM)</span>
      </div>
      <div>
        <strong>Balance:</strong>{" "}
        <span
          style={{
            color:
              airflow.balance === "positive"
                ? "#4ade80"
                : airflow.balance === "negative"
                ? "#f87171"
                : "#fbbf24",
            fontWeight: 700,
          }}
        >
          {airflow.balance.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
