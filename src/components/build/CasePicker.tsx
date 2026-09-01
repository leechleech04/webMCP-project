import { useMemo, useState } from "react";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import { caseProfiles } from "../../domain/cases/caseProfiles";
import { selectCase } from "../../domain/commands/selectCase";
import { useBuildStore } from "../../store/buildStore";

export function CasePicker({ dragging }: { dragging?: boolean }) {
  const state = useBuildStore((s) => s);
  const active = useMemo(() => getActiveCaseProfile(state), [state]);
  const [message, setMessage] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const onSelect = (componentId: string) => {
    if (dragging) {
      setMessage("Cannot switch case while dragging");
      return;
    }
    try {
      selectCase({ componentId });
      setMessage(`Switched to ${caseProfiles.find((p) => p.componentId === componentId)?.label}`);
      setErrorDetail(null);
      setTimeout(() => setMessage(null), 2200);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setMessage(msg);
      setErrorDetail(msg);
    }
  };

  return (
    <section
      aria-labelledby="case-picker-title"
      style={{
        marginTop: "0.5rem",
        border: "1px solid #1e293b",
        borderRadius: "10px",
        padding: "0.6rem 0.75rem",
        background: "#0c1320",
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.35rem",
          marginBottom: "0.5rem",
        }}
      >
        <span
          id="case-picker-title"
          style={{
            fontSize: "0.72rem",
            color: "#60a5fa",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 800,
          }}
        >
          Chassis Form Factor
        </span>
        <span
          style={{
            fontSize: "0.68rem",
            color: "#38bdf8",
            fontWeight: 700,
            background: "#111a2b",
            padding: "0.15rem 0.45rem",
            borderRadius: "4px",
            border: "1px solid #1e293b",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {active.formFactor} ({active.dimensionsMm.width}×{active.dimensionsMm.height}×{active.dimensionsMm.depth}mm)
        </span>
      </div>

      {/* 2x2 Clean Grid for Spacious Button Fitting */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.45rem" }}>
        {caseProfiles.map((p) => {
          const isActive = p.componentId === active.componentId;
          const shortName = p.label.split(" —")[0];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.componentId)}
              disabled={dragging}
              style={{
                padding: "0.45rem 0.5rem",
                borderRadius: "8px",
                border: isActive ? "1px solid #38bdf8" : "1px solid #28354a",
                background: isActive ? "rgba(30, 58, 138, 0.5)" : "#111a2b",
                color: isActive ? "#ffffff" : "#94a3b8",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                minWidth: 0,
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
              title={`${p.label} · ${p.dimensionsMm.width}×${p.dimensionsMm.height}×${p.dimensionsMm.depth} mm`}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  color: isActive ? "#38bdf8" : "#cbd5e1",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {shortName}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: isActive ? "#93c5fd" : "#64748b",
                  marginTop: "0.1rem",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {p.dimensionsMm.width}×{p.dimensionsMm.height}×{p.dimensionsMm.depth} mm
              </div>
            </button>
          );
        })}
      </div>

      {message && (
        <div
          role="status"
          style={{
            marginTop: "0.45rem",
            padding: "0.4rem 0.55rem",
            borderRadius: "6px",
            background: errorDetail ? "rgba(127,29,29,0.25)" : "rgba(21,94,117,0.2)",
            border: `1px solid ${errorDetail ? "#7f1d1d" : "#155e75"}`,
            color: errorDetail ? "#fecaca" : "#67e8f9",
            fontSize: "0.72rem",
            lineHeight: 1.4,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}