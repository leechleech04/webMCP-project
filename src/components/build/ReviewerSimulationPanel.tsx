import { useState } from "react";

import { simulateChangesTool, getBuildStateTool, moveComponentTool, validateBuildTool } from "../../webmcp/toolImplementations";
import { useBuildStore } from "../../store/buildStore";

export function ReviewerSimulationPanel() {
  const placements = useBuildStore((state) => state.placements);
  const [output, setOutput] = useState("Simulation tools share the production WebMCP implementations.");
  const run = (value: unknown) => setOutput(JSON.stringify(value, null, 2));

  return (
    <section className="reviewer-panel" aria-labelledby="reviewer-title">
      <div className="panel-heading">
        <div>
          <h2 id="reviewer-title">Reviewer Simulation</h2>
          <p className="panel-caption">WebMCP transport unavailable · same tool implementations, local fallback.</p>
        </div>
        <span className="simulation-pill">SIMULATION</span>
      </div>
      <div className="command-row reviewer-actions">
        <button type="button" className="secondary" onClick={() => run(getBuildStateTool())}>Read state</button>
        <button type="button" className="secondary" onClick={() => run(validateBuildTool())}>Validate build</button>
        <button type="button" onClick={() => run(moveComponentTool({ componentId: "radiator-01", mountId: "radiator-top" }))} disabled={!placements.some((item) => item.componentId === "radiator-01")}>Agent move to Top</button>
        <button type="button" className="secondary" onClick={() => run(simulateChangesTool({ actions: [{ type: "MOVE_COMPONENT", componentId: "radiator-01", mountId: "radiator-top" }] }))} disabled={!placements.some((item) => item.componentId === "radiator-01")}>Simulate Top</button>
      </div>
      <pre className="tool-output" aria-live="polite">{output}</pre>
    </section>
  );
}
