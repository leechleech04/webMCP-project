# Build State Studio — AI PC Assembly Workspace (Stage 19)

An AI-assisted 3D PC assembly workspace where one deterministic topology drives the GUI, the Three.js/React Three Fiber 3D scene, deterministic validation, simulations, and the 13-tool WebMCP interface.

## Quick Start

```bash
npm install
npm run dev
npm test
npx tsc -b
npm run build
```

## Core Capabilities

### 1. Multi-Profile Case Form Factors
Supports 4 distinct case profiles with unique clearance constraints, camera orbits, fan locations, and mount limits:
- **MINI_PC**: Compact Cube (Mini-ITX, 190×200×200 mm)
- **SFF**: Mini Tower (Micro-ATX, 210×350×340 mm)
- **MFF**: Mid Tower (Lian Li Lancool 216 with sourced GLB asset, 235×491.7×480.9 mm)
- **LFF**: Full Tower (E-ATX/Extended, 270×560×580 mm)

### 2. Deterministic Domain & Transaction Engine
- **Central Mutation Path**: Live topology changes execute through `commitDomainAction`, ensuring monotonic revision increments and atomic transitions.
- **Agent Undo & Stale Protection**: AGENT actions snapshot topology state for undo (`undoLastAgentAction`). Any subsequent user change renders the undo stale (`UNDO_STALE`), preventing accidental loss of user edits.
- **Pure Simulation**: `simulateChanges` evaluates multi-step actions using pure transitions (`applyDomainAction`) without incrementing revision or mutating store state.
- **Build Assessment Layer**: Categorizes build readiness into `READY`, `INCOMPLETE`, and `CONFLICT` without breaking constraint validation contracts.

### 3. Complete 13-Tool WebMCP Interface
Exposes 13 canonical tools registered via `document.modelContext` with strict schema validation (`additionalProperties: false`) and per-tool `AbortController` lifecycles:
1. `get_build_state` (readOnly): Returns topology revision, placements, connections, fanConfigs, activity log, catalog summary, and undo availability.
2. `get_available_mounts` (readOnly): Lists unoccupied mounts filtered by active case profile, occupancy, component type, and dimensions.
3. `validate_build` (readOnly): Pure validation returning clearance collisions, power capacity, and airflow warnings.
4. `install_component`: Installs a component into an unoccupied compatible mount.
5. `move_component`: Moves an installed component to another compatible mount.
6. `remove_component`: Removes an installed component and its incident connections and fan configurations.
7. `connect_component`: Connects an output connector to a compatible input connector with strict error ordering (`CONNECTOR_NOT_FOUND` → `CONNECTOR_DIRECTION_INVALID` → `CONNECTOR_TYPE_MISMATCH` → `CONNECTION_ALREADY_EXISTS` → `CONNECTOR_OCCUPIED`).
8. `set_fan_direction`: Configures fan airflow direction (`INTAKE` / `EXHAUST`).
9. `simulate_changes`: Pure multi-action projection with detailed intermediate validation.
10. `select_case`: Switches active case profile with compatibility checks.
11. `auto_fill_build`: Deterministically populates compatible slots and cables for the active case.
12. `clear_build`: Resets components and cables after explicit confirmation (`confirm: true`), preserving the active case.
13. `undo_last_agent_action`: Safely reverses the most recent agent action.

### 4. 3D Visualization & Performance
- **Visuals**: Dual-RAM parallel placement, CPU waterblock with coolant tubes, animated 9-blade fan rotors, intake/exhaust airflow direction visualization, interactive 3D camera controls.
- **Performance**: Lazy-loaded `PcScene` with manual code-splitting chunks (`three`, `react-three`) to minimize initial bundle size and prevent layout shifts.
