# Stage 09 — WebMCP move action

- Scope: `move_component` input validation, stable output, post-action validation, and shared command routing.
- Contracts consumed: `moveComponent()` domain command and the canonical Mount ID registry.
- Implementation paths: `src/webmcp/toolImplementations.ts`, `src/webmcp/moveComponent.ts`, `src/domain/commands/transition.ts`.
- Tests/evidence: successful and failed moves are tested; failed moves leave the detached BuildState unchanged; no `buildStore.setState()` exists under `src/webmcp/`.
- Known limitations: tool input schemas are structural JSON schemas; deeper catalog checks happen in the domain command.
- Deferred work: undo/transaction history beyond activity entries.
- Verdict: **PASS**.
