# Stage 06 — GPU/radiator clearance

- Scope: deterministic GPU depth versus front-radiator clearance.
- Contracts consumed: `BuildState`, `Placement`, stable IDs `gpu-01`, `radiator-01`.
- Implementation paths: `src/domain/constraints/gpuRadiatorClearance.ts`, `validateBuild.ts`.
- Tests/evidence: `constraints.test.ts` covers empty, GPU-only, radiator-only, Top, Front, stable issue shape, determinism, and immutability; cumulative suite passes.
- Known limitations: the 320 mm value is an MVP demo rule, not a universal case specification.
- Deferred work: remaining cable, PSU, and airflow validators belong to Stage 13.
- Verdict: **PASS**.
