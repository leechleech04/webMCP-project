# Stage 12 — Activity panel

- Scope: shared activity-entry creation, actor labels, deterministic injection hooks, and timeline UI.
- Contracts consumed: `BuildState.activity`, `ActivityActor` (`USER`, `AGENT`, `SYSTEM`).
- Implementation paths: `src/domain/activity.ts`, `src/domain/commands/recordActivity.ts`, `ActivityPanel.tsx`, `toolImplementations.ts`.
- Tests/evidence: command success entries, no failed-command entry, simulation purity, stable ordering, and USER/AGENT/SYSTEM propagation are covered by the domain/WebMCP tests; StrictMode-safe registration avoids duplicate tool writes.
- Known limitations: timestamps are local ISO timestamps in production.
- Deferred work: durable persistence outside the browser session.
- Verdict: **PASS**.
