# Stage 13 — Expanded constraints

- Scope: GPU power-cable clearance, PSU reserve/connector checks, and airflow direction balance in stable aggregate order.
- Contracts consumed: dimensions, power fields, connector definitions, placements, fanConfigs, mount constraints.
- Implementation paths: `gpuCableClearance.ts`, `psuPower.ts`, `airflow.ts`, `validateBuild.ts`.
- Tests/evidence: injected fixtures cover cable PASS/boundary/FAIL, missing and weak/mismatched/valid PSU, and no-fan/missing/one-sided/balanced airflow.
- Known limitations: thresholds are named MVP rules; the minimal Stage 05 catalog intentionally gates PSU missing checks on a motherboard-powered build so the Stage 10 GPU/radiator demo stays focused.
- Deferred work: full frozen production catalog and commercial-specific topology rules.
- Verdict: **PASS** for the injected-fixture MVP rules.
