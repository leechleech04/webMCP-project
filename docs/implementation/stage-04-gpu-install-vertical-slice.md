# Stage 04 — GPU Install Vertical Slice

Owner: Developer A + Developer B integration

Base: `origin/main` at `266bf24c537ad53322a754d72b9eebb1a1978686`

Branch: `feature/stage-04-gpu-install-vertical-slice`

Status: verified locally and browser-verified by the requester; commit blocked by missing Git identity

Intended commit: `feat(stage-04): verify GPU install vertical slice`

## Objective

Prove the complete GPU install/remove path without changing the frozen domain
contracts: the GUI dispatches the existing commands, Zustand `BuildState` is the
single source of truth, and `PcScene` renders `GpuModel` at `pcie-slot-1` only
while `{ componentId: "gpu-01", mountId: "pcie-slot-1" }` exists.

## State flow

- Install: `Install GPU` → `installComponent({ componentId: "gpu-01", mountId: "pcie-slot-1" })` → one placement → `useBuildStore` selector → one `GpuModel`.
- Remove: `Remove GPU` → `removeComponent({ componentId: "gpu-01" })` → placement removed → GPU model removed.
- Repeated install is rejected by the existing duplicate guard; no second
  placement is created.

## Files consumed

- `src/app/App.tsx`
- `src/domain/commands/installComponent.ts`
- `src/domain/commands/removeComponent.ts`
- `src/store/buildStore.ts`
- `src/components/scene/PcScene.tsx`
- `src/components/scene/GpuModel.tsx`
- `src/scene/mountTransforms.ts`

## Files changed

- `src/app/App.tsx` — integrated milestone copy changed from Step 3 to Stage 4.
- `src/components/scene/PcScene.test.tsx` — focused real-command/shared-store/
  scene-marker integration coverage.
- `docs/implementation/stage-04-gpu-install-vertical-slice.md` — this record.

## Acceptance evidence

- Focused integration test: 4/4 passing, including initial absence, exact
  placement and single render at `[-1, 2.6, -0.15]`, removal, and duplicate
  protection.
- Full suite: `npm test` — 20/20 passing across 3 test files (baseline was
  16 tests).
- Production build: `npm run build` — PASS.
- Formatting check: `git diff --check` — PASS.
- Browser: requester manually verified the real Install/Remove flow and visible
  GPU geometry. The agent browser harness could not attach to Chrome, so the
  console error count was not independently captured; no zero-error claim is
  made.

## Deferred scope

No connections, constraints, simulation, WebMCP, activity logging, revision
tracking, GLB assets, animation, visual redesign, or Stage 5 work.
