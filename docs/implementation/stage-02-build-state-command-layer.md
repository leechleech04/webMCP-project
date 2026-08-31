# Stage 02 — Build State + Command Layer

Owner: Developer 2

Base: `origin/main` at `f06ebcaaa6ecefe825ffbfa7c17e665990598605`

Status: contract-aligned and verified locally

## Implemented scope

- Frozen Stage 01 domain types for components, mounts, placements, connections,
  actions, constraints, and `BuildState`
- Zustand-backed shared `BuildState`
- `installComponent`, `moveComponent`, and `removeComponent`
- React debug screen showing the installed GPU and mount
- Command tests for success, validation failures, unchanged-state failures,
  cascading removal, and detached state snapshots

The canonical implementation paths are:

- `src/domain/types/`
- `src/domain/data/`
- `src/domain/commands/`
- `src/store/buildStore.ts`

The shorter `src/domain/*.ts`, `src/commands/`, and `src/state/` files are
compatibility re-exports only. New implementation code should use the canonical
paths above.

## Frozen-contract note

`MountDefinition` intentionally contains only `id`, `type`,
`supportedComponentTypes`, and optional `constraints`. Display labels are
derived from `mount.id` in the UI; they are not a required domain field.

## Deferred work

Connections, fan direction, activity generation, constraints, simulation,
WebMCP, and 3D integration remain later-stage work. Their existing files are
placeholders and must not be reported as implemented.

## Verification

```text
npm test       14/14 PASS
npm run build  PASS
git diff --check PASS
```

Commit and push status is tracked by Git rather than duplicated in this file.
