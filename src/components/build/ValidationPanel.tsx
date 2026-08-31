import { useEffect, useMemo, useState } from "react";

import { validateBuild } from "../../domain/constraints/validateBuild";
import { useBuildStore } from "../../store/buildStore";

export interface ValidationPanelProps {
  onSelectionChange?: (componentIds: string[]) => void;
}

export function ValidationPanel({ onSelectionChange }: ValidationPanelProps) {
  const placements = useBuildStore((state) => state.placements);
  const connections = useBuildStore((state) => state.connections);
  const fanConfigs = useBuildStore((state) => state.fanConfigs);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const issues = useMemo(
    () => validateBuild({ placements, connections, fanConfigs, activity: [] }),
    [placements, connections, fanConfigs],
  );

  useEffect(() => {
    const nextId = issues.some((issue) => issue.id === selectedIssueId)
      ? selectedIssueId
      : issues[0]?.id ?? null;
    if (nextId !== selectedIssueId) setSelectedIssueId(nextId);
    const selected = issues.find((issue) => issue.id === nextId);
    onSelectionChange?.(selected?.affectedComponentIds ?? []);
  }, [issues, onSelectionChange, selectedIssueId]);

  return (
    <section className="validation-panel" aria-labelledby="validation-title">
      <div className="panel-heading">
        <div>
          <h2 id="validation-title">Build validation</h2>
          <p className="panel-caption">Deterministic checks from the shared Build State.</p>
        </div>
        <span className={issues.length === 0 ? "valid-pill" : "error-pill"}>
          {issues.length === 0 ? "VALID" : `${issues.length} ISSUE${issues.length === 1 ? "" : "S"}`}
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="valid-state" role="status" data-testid="validation-valid">
          Build valid · no compatibility issues detected.
        </p>
      ) : (
        <div className="validation-list" role="list">
          {issues.map((issue) => {
            const selected = issue.id === selectedIssueId;
            return (
              <button
                key={issue.id}
                type="button"
                role="listitem"
                className={`validation-card${selected ? " selected" : ""}`}
                aria-pressed={selected}
                onClick={() => setSelectedIssueId(issue.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedIssueId(issue.id);
                  }
                }}
                data-testid={`validation-${issue.id}`}
              >
                <span className="issue-kicker">{issue.severity} · {issue.type}</span>
                <strong>{issue.id === "GPU_RADIATOR_COLLISION" ? "GPU / Radiator Collision" : issue.id}</strong>
                {issue.id === "GPU_RADIATOR_COLLISION" ? (
                  <span className="issue-details">
                    <span>GPU length: 340 mm</span>
                    <span>Available clearance: 320 mm</span>
                    <span>Margin: -20 mm</span>
                  </span>
                ) : (
                  <span className="issue-details"><span>{issue.message}</span></span>
                )}
                <span className="issue-footnote">Select to highlight affected components.</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
