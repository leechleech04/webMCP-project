import { lazy, Suspense, useEffect, useState } from "react";
import { ActivityPanel } from "../components/build/ActivityPanel";
import { ReviewerSimulationPanel } from "../components/build/ReviewerSimulationPanel";
import { ValidationPanel } from "../components/build/ValidationPanel";
import { CasePicker } from "../components/build/CasePicker";
import { BuildControls } from "../components/build/BuildControls";
import { ComponentPalette } from "../components/build/ComponentPalette";
import { useBuildStore } from "../store/buildStore";
import { getRuntimeMode, registerTools, type RuntimeMode } from "../webmcp/registerTools";
import { useLanguage } from "../i18n/LanguageContext";

const PcScene = lazy(() =>
  import("../components/scene/PcScene").then((module) => ({ default: module.PcScene })),
);

export function App() {
  const { language, setLanguage, t } = useLanguage();
  const placements = useBuildStore((state) => state.placements);
  const [highlightedComponentIds, setHighlightedComponentIds] = useState<string[]>([]);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>(() => getRuntimeMode());
  const [toolCounts, setToolCounts] = useState<{ registered: number; total: number }>({
    registered: 0,
    total: 13,
  });

  useEffect(() => {
    let alive = true;
    let cleanup: () => void = () => undefined;
    void registerTools({ timeoutMs: 10000, intervalMs: 500 }).then((registration) => {
      if (alive) {
        setRuntimeMode(registration.mode);
        setToolCounts({
          registered: registration.registeredTools.length,
          total: registration.toolDefinitions.length,
        });
        cleanup = registration.cleanup;
      } else {
        registration.cleanup();
      }
    });
    return () => {
      alive = false;
      cleanup();
    };
  }, []);

  const gpuPlacement = placements.find((placement) => placement.componentId.startsWith("gpu"));
  const radiatorPlacement = placements.find((placement) => placement.componentId.startsWith("radiator"));

  const statusBadgeText =
    runtimeMode === "webmcp"
      ? t("status.live", toolCounts)
      : runtimeMode === "partial"
        ? t("status.partial", toolCounts)
        : t("status.simulation", { total: toolCounts.total });

  return (
    <main className="workspace-shell">
      <section className="debug-card" aria-labelledby="debug-title">
        <header className="workspace-header">
          <div className="brand-lockup">
            <span className="brand-index" aria-hidden="true">PB</span>
            <div>
              <div className="eyebrow">{t("app.eyebrow")}</div>
              <h1 id="debug-title">{t("app.title")}</h1>
              <p>{t("app.subtitle")}</p>
            </div>
          </div>
          <div className="header-utilities">
            <span className={`status-badge status-${runtimeMode}`}>{statusBadgeText}</span>
            <div className="language-switch" role="group" aria-label={t("language.label")}>
              {(["en", "ko"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={language === option ? "active" : ""}
                  aria-pressed={language === option}
                  onClick={() => setLanguage(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="workbench-grid">
          <aside className="setup-rail" aria-label={t("scene.controls")}>
            <div className="rail-heading">
              <span>{t("workspace.controlsKicker")}</span>
              <p>{t("workspace.controlsCaption")}</p>
            </div>
            <CasePicker />
            <BuildControls />
          </aside>

          <section className="stage-column" aria-labelledby="assembly-heading">
            <div className="stage-heading">
              <div>
                <h2 id="assembly-heading">{t("workspace.assemblyTitle")}</h2>
                <p>{t("workspace.assemblyCaption")}</p>
              </div>
              <span>{placements.length} / 15</span>
            </div>
            <div className="scene-card">
              <Suspense fallback={<div className="scene-loading">{t("scene.loading")}</div>}>
                <PcScene highlightedComponentIds={highlightedComponentIds} />
              </Suspense>
              <div className="scene-overlay" aria-hidden="true">
                <span>{t("scene.live")}</span>
                <strong>{gpuPlacement ? t("scene.gpu", { id: gpuPlacement.componentId, mount: gpuPlacement.mountId }) : t("scene.gpuMissing")}</strong>
                <strong>{radiatorPlacement ? t("scene.radiator", { id: radiatorPlacement.componentId, mount: radiatorPlacement.mountId }) : t("scene.radiatorMissing")}</strong>
                {highlightedComponentIds.length > 0 && <em>{t("scene.conflict")}</em>}
              </div>
            </div>
            <div className="scene-hint">{t("scene.hint")}</div>
          </section>

          <aside className="parts-rail" aria-label={t("catalog.aria")}>
            <ComponentPalette />
          </aside>
        </div>

        <section className="review-dock" aria-labelledby="review-heading">
          <div className="dock-heading">
            <div>
              <h2 id="review-heading">{t("workspace.reviewTitle")}</h2>
              <p>{t("workspace.reviewCaption")}</p>
            </div>
          </div>
          <div className="insight-grid">
            <ValidationPanel onSelectionChange={setHighlightedComponentIds} />
            <ActivityPanel />
          </div>
        </section>

        {runtimeMode !== "webmcp" && <ReviewerSimulationPanel />}

        <details className="developer-details">
          <summary>{t("debug.details")} <span>{t("debug.placements", { count: placements.length })}</span></summary>
          <pre>{JSON.stringify({ placements }, null, 2)}</pre>
        </details>
      </section>
    </main>
  );
}
