import { useState } from "react";

import { simulateChangesTool, getBuildStateTool, moveComponentTool, validateBuildTool } from "../../webmcp/toolImplementations";
import { useBuildStore } from "../../store/buildStore";
import { useLanguage } from "../../i18n/LanguageContext";
import { componentRegistry } from "../../domain/data/components";

export function ReviewerSimulationPanel() {
  const { t } = useLanguage();
  const placements = useBuildStore((state) => state.placements);
  const radiator = placements.find((placement) => componentRegistry[placement.componentId]?.type === "RADIATOR");
  const [output, setOutput] = useState<string | null>(null);
  const run = (value: unknown) => setOutput(JSON.stringify(value, null, 2));

  return (
    <section className="reviewer-panel" aria-labelledby="reviewer-title">
      <div className="panel-heading">
        <div>
          <h2 id="reviewer-title">{t("review.title")}</h2>
          <p className="panel-caption">{t("review.caption")}</p>
        </div>
        <span className="simulation-pill">{t("review.badge")}</span>
      </div>
      <div className="command-row reviewer-actions">
        <button type="button" className="secondary" onClick={() => run(getBuildStateTool())}>{t("review.read")}</button>
        <button type="button" className="secondary" onClick={() => run(validateBuildTool())}>{t("review.validate")}</button>
        <button type="button" onClick={() => radiator && run(moveComponentTool({ componentId: radiator.componentId, mountId: "radiator-top" }))} disabled={!radiator}>{t("review.move")}</button>
        <button type="button" className="secondary" onClick={() => radiator && run(simulateChangesTool({ actions: [{ type: "MOVE_COMPONENT", componentId: radiator.componentId, mountId: "radiator-top" }] }))} disabled={!radiator}>{t("review.simulate")}</button>
      </div>
      <pre className="tool-output" aria-live="polite">{output ?? t("review.initial")}</pre>
    </section>
  );
}
