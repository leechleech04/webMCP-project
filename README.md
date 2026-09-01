# Build State Studio

An AI-assisted PC assembly workspace where one serializable Build State drives the UI, 3D scene, deterministic validation, simulations, and WebMCP tools.

## Run and verify

```bash
npm install
npm run dev
npm test
npm run build
```

The app starts with the case and motherboard installed. A build is:

- `INCOMPLETE` when required components, connections, or fan configuration are missing.
- `CONFLICT` when a deterministic compatibility rule fails.
- `READY` only when all required checks pass.

## WebMCP contract

Ten tools are registered through `document.modelContext`: state/mount inspection, readiness validation, install/move/remove, typed connection, fan direction, atomic simulation, and safe undo. Registration is single-flight and reference-counted so React StrictMode cleanup cannot remove another live registration. The UI reports `WebMCP live` only when all required tools register successfully.

Undo restores only the latest agent topology action. If another topology change occurs afterward, undo fails with `UNDO_STALE` instead of discarding the later change.

## Data boundary

The Lian Li case specifications and attributed GLB are marked `SOURCED`. Other catalog items and the 320 mm front-radiator clearance rule are deterministic challenge fixtures marked `DEMO`; they are not purchasing advice. This boundary is visible in the component palette.

## Architecture

- `src/domain`: pure transitions, constraints, readiness assessment, simulation, and command history.
- `src/store`: the authoritative Zustand Build State.
- `src/webmcp`: schemas, runtime input validation, telemetry, registration lifecycle, and tool adapters.
- `src/components`: component palette, build/connection tree, validation, activity/undo, and the lazy-loaded 3D scene.
