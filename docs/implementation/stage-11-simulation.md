# Stage 11 — Pure simulation

- Scope: pure DomainAction transition dispatcher and atomic `simulateChanges`.
- Contracts consumed: existing install/move/remove public command signatures; cloned BuildState input.
- Implementation paths: `src/domain/commands/transition.ts`, `src/domain/simulation/simulateChanges.ts`, `src/webmcp/simulateChanges.ts`.
- Tests/evidence: Front→Top clears collision, invalid actions roll back the projection, input and live Zustand state remain unchanged, subscribers are not notified, and command wrappers commit once.
- Known limitations: simulation supports the implemented DomainAction union; no optimization or physical simulation is attempted.
- Deferred work: richer action batches and undo/redo.
- Verdict: **PASS**.
