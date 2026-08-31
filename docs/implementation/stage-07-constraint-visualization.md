# Stage 07 — Constraint visualization

- Scope: validation panel, selectable collision card, and restrained scene highlighting.
- Contracts consumed: pure `validateBuild`, shared Zustand placements, mount-transform scene boundary.
- Implementation paths: `src/components/build/ValidationPanel.tsx`, `src/app/App.tsx`, `src/components/scene/PcScene.tsx`, `GpuModel.tsx`, `RadiatorModel.tsx`.
- Tests/evidence: scene integration asserts affected IDs reach both models and a non-selected model remains unhighlighted; desktop/browser evidence is recorded in the final report.
- Known limitations: highlight uses emissive/material and edge color, without post-processing.
- Deferred work: visual polish beyond the collision/repair slice.
- Verdict: **PASS**.
