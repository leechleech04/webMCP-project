import { useEffect, useMemo, useState } from "react";

import { assessBuildState } from "../../domain/constraints/buildAssessment";
import { useBuildStore } from "../../store/buildStore";
import { useLanguage } from "../../i18n/LanguageContext";

export interface ValidationPanelProps {
  onSelectionChange?: (componentIds: string[]) => void;
}

export function ValidationPanel({ onSelectionChange }: ValidationPanelProps) {
  const { language, t } = useLanguage();
  const placements = useBuildStore((state) => state.placements);
  const connections = useBuildStore((state) => state.connections);
  const fanConfigs = useBuildStore((state) => state.fanConfigs);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const assessment = useMemo(
    () => assessBuildState({ placements, connections, fanConfigs, activity: [] }),
    [placements, connections, fanConfigs],
  );
  const { issues } = assessment;
  const tone = assessment.status === "CONFLICT"
    ? "error"
    : assessment.status === "INCOMPLETE" || issues.length > 0
      ? "warning"
      : "valid";
  const badge = assessment.status === "READY" && issues.length > 0
    ? t("validation.status.warning")
    : t(`validation.status.${assessment.status.toLowerCase()}`);

  useEffect(() => {
    const nextId = issues.some((issue) => issue.id === selectedIssueId)
      ? selectedIssueId
      : issues[0]?.id ?? null;
    if (nextId !== selectedIssueId) setSelectedIssueId(nextId);
    const selected = issues.find((issue) => issue.id === nextId);
    onSelectionChange?.(selected?.severity === "ERROR" ? selected.affectedComponentIds : []);
  }, [issues, onSelectionChange, selectedIssueId]);

  return (
    <section className="validation-panel" aria-labelledby="validation-title">
      <div className="panel-heading">
        <div>
          <h2 id="validation-title">{t("validation.title")}</h2>
          <p className="panel-caption">{t("validation.caption")}</p>
        </div>
        <span className={`${tone}-pill`}>
          {badge}
        </span>
      </div>

      <p className={`assessment-state ${tone}`} role="status" data-testid={`validation-${tone}`}>
        {assessment.status === "READY" && issues.length === 0
          ? t("validation.clear")
          : assessment.status === "INCOMPLETE"
            ? t("validation.incompleteSummary", {
                components: assessment.missingComponentTypes.length,
                cables: assessment.missingPowerConnections.length,
              })
            : assessment.summary}
      </p>

      {issues.length > 0 && (
        <div className="validation-list" role="list">
          {issues.map((issue) => {
            const selected = issue.id === selectedIssueId;
            return (
              <button
                key={issue.id}
                type="button"
                role="listitem"
                className={`validation-card ${issue.severity.toLowerCase()}${selected ? " selected" : ""}`}
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
                <span className="issue-kicker">{language === "ko" ? localizeIssueMeta(issue.severity) : issue.severity} · {language === "ko" ? localizeIssueMeta(issue.type) : issue.type}</span>
                <strong>{issue.id === "GPU_RADIATOR_COLLISION" ? t("validation.collision") : language === "ko" ? localizeIssueTitle(issue.id) : issue.id}</strong>
                {issue.id === "GPU_RADIATOR_COLLISION" ? (
                  <span className="issue-details">
                    <span>{t("validation.gpuLengthValue", { value: Number(issue.details?.gpuLengthMm ?? 0) })}</span>
                    <span>{t("validation.clearanceValue", { value: Number(issue.details?.availableClearanceMm ?? 0) })}</span>
                    <span>{t("validation.marginValue", { value: Number(issue.details?.marginMm ?? 0) })}</span>
                  </span>
                ) : (
                  <span className="issue-details"><span>{language === "ko" ? localizeIssue(issue.message) : issue.message}</span></span>
                )}
                <span className="issue-footnote">{t("validation.select")}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

const localizeIssue = (message: string) => message
  .replace("No case fans are installed.", "케이스 팬이 설치되어 있지 않습니다.")
  .replace("A PSU is required for the installed powered components.", "전력이 필요한 부품을 위해 파워서플라이가 필요합니다.")
  .replace("Fan direction is not configured for:", "팬 방향이 설정되지 않음:")
  .replace("Airflow is unbalanced:", "공기 흐름 불균형:")
  .replace(" intake / ", " 흡기 / ")
  .replace(" exhaust.", " 배기입니다.")
  .replace("GPU power cable clearance:", "GPU 전원 케이블 여유 공간:")
  .replace(" available; ", " 사용 가능; ")
  .replace(" required; Margin:", " 필요; 여유:");

const localizeIssueMeta = (value: string) => ({
  ERROR: "오류", WARNING: "경고", CLEARANCE: "공간", CABLE: "케이블", POWER: "전원",
  CONNECTOR: "커넥터", AIRFLOW: "공기 흐름",
}[value] ?? value);

const localizeIssueTitle = (id: string) => ({
  AIRFLOW_NO_FANS: "케이스 팬 없음",
  AIRFLOW_DIRECTION_UNCONFIGURED: "팬 방향 미설정",
  AIRFLOW_UNBALANCED: "공기 흐름 불균형",
  PSU_MISSING: "파워서플라이 없음",
  PSU_INSUFFICIENT_CAPACITY: "파워 용량 부족",
  PSU_GPU_CONNECTOR_MISMATCH: "GPU 전원 커넥터 불일치",
  GPU_CABLE_CLEARANCE: "GPU 케이블 여유 공간 부족",
}[id.split(":")[0]] ?? id);
