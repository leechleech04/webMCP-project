import { useMemo, useState } from "react";
import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import { autoFillBuild } from "../../domain/commands/autoFillBuild";
import { clearBuild } from "../../domain/commands/clearBuild";
import { generateAutoFillRecipe } from "../../domain/recipes/autoFillRecipe";

export function BuildControls() {
  const state = useBuildStore((s) => s);
  const activeProfile = useMemo(() => getActiveCaseProfile(state), [state]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const preview = useMemo(() => {
    try {
      const plan = generateAutoFillRecipe(state);
      return {
        count: plan.placements.length,
        components: plan.placements.map((p) => p.componentId),
        fanCount: plan.fanConfigs.length,
        connectionsCount: plan.connections.length,
      };
    } catch {
      return { count: 0, components: [], fanCount: 0, connectionsCount: 0 };
    }
  }, [state]);

  const installedNonCaseCount = useMemo(
    () => state.placements.filter((p) => p.mountId !== "case-root").length,
    [state.placements],
  );

  const handleAutoFill = () => {
    try {
      const outcome = autoFillBuild();
      setStatusMessage(
        `Auto-fill applied for ${activeProfile.formFactor}: +${outcome.appliedPlacements.length} components, +${outcome.appliedConnections.length} cables, +${outcome.appliedFanConfigs.length} fan directions configured.`,
      );
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleConfirmClear = () => {
    try {
      const outcome = clearBuild({ confirm: true });
      setStatusMessage(
        `Build cleared: removed ${outcome.clearedComponentsCount} components, ${outcome.clearedConnectionsCount} cables, ${outcome.clearedFanConfigsCount} fan configs. Active case (${activeProfile.label}) preserved.`,
      );
      setErrorMessage(null);
      setConfirmingClear(false);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setConfirmingClear(false);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <section
      aria-label="Build Actions"
      style={{
        marginTop: "0.65rem",
        border: "1px solid #28354a",
        borderRadius: "12px",
        padding: "0.75rem",
        background: "#0c1320",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "#60a5fa",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Build Actions
        </h3>
        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
          {installedNonCaseCount} component{installedNonCaseCount === 1 ? "" : "s"} installed
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={preview.count === 0}
          style={{
            flex: "1 1 140px",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            background: preview.count > 0 ? "#1d4ed8" : "#1e293b",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.78rem",
            border: preview.count > 0 ? "1px solid #3b82f6" : "1px solid #334155",
            cursor: preview.count > 0 ? "pointer" : "not-allowed",
          }}
          title={
            preview.count > 0
              ? `Auto-fill missing mounts (+${preview.count} parts) for ${activeProfile.formFactor}`
              : "Build already has all mounts filled for current case"
          }
        >
          ⚡ Auto Fill Build {preview.count > 0 ? `(+${preview.count})` : "(Full)"}
        </button>

        {!confirmingClear ? (
          <button
            type="button"
            className="secondary"
            onClick={() => setConfirmingClear(true)}
            disabled={installedNonCaseCount === 0}
            style={{
              flex: "1 1 120px",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              background: installedNonCaseCount > 0 ? "#450a0a" : "#1e293b",
              color: installedNonCaseCount > 0 ? "#fca5a5" : "#64748b",
              fontWeight: 700,
              fontSize: "0.78rem",
              border: installedNonCaseCount > 0 ? "1px solid #991b1b" : "1px solid #334155",
              cursor: installedNonCaseCount > 0 ? "pointer" : "not-allowed",
            }}
            title="Remove all installed parts while preserving the active case"
          >
            🗑️ Clear Build
          </button>
        ) : null}
      </div>

      {confirmingClear && (
        <div
          role="alertdialog"
          aria-labelledby="clear-dialog-title"
          style={{
            marginTop: "0.65rem",
            padding: "0.65rem",
            borderRadius: "8px",
            background: "rgba(127, 29, 29, 0.28)",
            border: "1px solid #b91c1c",
          }}
        >
          <div id="clear-dialog-title" style={{ fontSize: "0.78rem", fontWeight: 800, color: "#fecaca" }}>
            Confirm Clear Build?
          </div>
          <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "0.25rem", lineHeight: 1.4 }}>
            All non-case components ({installedNonCaseCount}), power cables, and fan directions will be removed. The
            active case <strong style={{ color: "#60a5fa" }}>{activeProfile.label}</strong> will remain selected at{" "}
            <code>case-root</code>.
          </div>
          <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={handleConfirmClear}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                background: "#dc2626",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.74rem",
                border: "none",
              }}
            >
              Yes, Clear Build
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmingClear(false)}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.74rem",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          style={{
            marginTop: "0.55rem",
            padding: "0.45rem 0.55rem",
            borderRadius: "8px",
            background: "rgba(21, 128, 61, 0.2)",
            border: "1px solid #16a34a",
            color: "#86efac",
            fontSize: "0.75rem",
            lineHeight: 1.4,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: "0.55rem",
            padding: "0.45rem 0.55rem",
            borderRadius: "8px",
            background: "rgba(127, 29, 29, 0.25)",
            border: "1px solid #b91c1c",
            color: "#fca5a5",
            fontSize: "0.75rem",
            lineHeight: 1.4,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {errorMessage}
        </div>
      )}
    </section>
  );
}
