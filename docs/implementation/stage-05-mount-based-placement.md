# Stage 5 — Mount-based 3D placement

## Outcome

The scene now renders placed components from the shared Build State by resolving
each `placement.mountId` through one scene-owned transform registry. UI and
domain commands only send component and Mount IDs; they do not calculate or
store 3D coordinates.

## Runtime flow

```text
UI / future WebMCP adapter
  -> installComponent | moveComponent | removeComponent
  -> Zustand Build State placements
  -> PcScene
  -> componentId -> modelRegistry
  -> mountId -> mountTransforms
  -> model(position, rotation, optional scale)
```

## Implemented mounts and models

- `pcie-slot-1` renders `gpu-01`.
- `radiator-front` renders `radiator-01` vertically at the case front.
- `radiator-top` renders the same radiator horizontally at the case top.
- `motherboard-tray` remains the transform source for the motherboard fixture.

The radiator debug controls exercise the real domain commands: install at the
front mount, move between front and top, and remove. A move changes only the
Build State Mount ID; `PcScene` derives the new position and rotation.

## Invariants

- Domain component and mount registries remain the source of installation and
  compatibility validation.
- Build State contains IDs only. It does not contain Three.js coordinates.
- The UI contains no component placement coordinates.
- Missing transforms fail fast in the renderer instead of silently placing a
  component at an arbitrary origin.
- Unknown component models are ignored until their scene model is registered.

## Scope boundary

This stage keeps BoxGeometry prototypes. Real GLTF assets, collision-aware
placement, animations, and WebMCP tool registration are later-stage work.
