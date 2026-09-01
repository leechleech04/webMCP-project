# Stage 19 — Fan Reliability, Orbit UX, Studio Visuals, Auto Fill / Clear Build & Fullscreen 3D Viewer

## 1. Overview & Architecture

Stage 19 delivers critical usability, visual refinement, and batch domain controls to the PC Assembly Workspace:
1. **Fan Reliability & Metadata Contract**: Deterministic assignment of `recommendedDirection` (`INTAKE` vs `EXHAUST`) upon installation, explicit direction toggle, and preservation across mount moves.
2. **Orbit-First Gesture Model & Move Mode**: Natural camera rotation anywhere on the 3D viewport with single-click selection and explicit `Move Mode` (armed with `'M'` key or UI button) displaying compatible snap indicators.
3. **Studio Visuals & Fullscreen 3D Viewer**: Studio lighting environment (`#e2e8f0` background, ACESFilmicToneMapping, hemisphere and directional key/fill/rim lights) alongside Dark theme toggle and dedicated **`⛶ Fullscreen 3D`** immersion viewer.
4. **Deterministic Batch Commands (`autoFillBuild` & `clearBuild`)**: Form-factor aware auto-population of missing components, fan directions, and power cabling, paired with safe clear build requiring explicit confirmation.
5. **WebMCP Canonical Tools Parity**: Exposure of `auto_fill_build` and `clear_build` tools with schema validation, telemetry tracking, and structured JSON results.

---

## 2. Fan Reliability & Case Mount Matrix

### Fan Mount Profiles & Default Airflow
| Mount Location | Mount ID Pattern | Default Direction | CFM Rating | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Front** | `fan-front-1`, `fan-front-2`, `fan-front-3` | `INTAKE` | 60 CFM | Primary cool air ingestion from front mesh |
| **Bottom** | `fan-bottom-1` | `INTAKE` | 60 CFM | Cool air ingestion from bottom PSU/floor shroud |
| **Side** | `fan-side-1` | `INTAKE` | 60 CFM | Direct airflow onto GPU/motherboard components |
| **Top** | `fan-top-1`, `fan-top-2`, `fan-top-3` | `EXHAUST` | 60 CFM | Natural thermal convection exhaust |
| **Rear** | `fan-rear-1` | `EXHAUST` | 60 CFM | Direct heat removal behind CPU socket |

### Domain Behavior
- **`INSTALL_COMPONENT`**: When installing any `FAN` component into a case fan mount, the domain transition engine atomically assigns the mount's recommended direction into `state.fanConfigs`.
- **`SET_FAN_DIRECTION`**: Allows instant flipping between `INTAKE` and `EXHAUST` both in the 3D overlay card and WebMCP tool interface.
- **`MOVE_COMPONENT`**: Moving a fan across mounts preserves custom direction configuration while updating the mount binding.

---

## 3. Orbit UX, Studio Visuals & Fullscreen 3D Viewer

### Interaction Model
- **Orbit Controls Default**: Pointer-down gestures across the canvas initiate smooth 3D camera rotation and zoom without interference.
- **Single-Click Selection**: On pointer-up, if movement is <= 6px, the hovered component is selected, displaying its floating contextual card with mount ID, fan direction controls, and action buttons.
- **Explicit Move Mode**: Armed by pressing `'M'` or clicking "Move Component ('M')". Renders 3D bounding box snap targets over compatible empty mounts. Pressing `Escape` disarms Move Mode.
- **Studio Environment**:
  - Background: Bright neutral `#e2e8f0` with soft atmospheric fog.
  - Tone Mapping: `THREE.ACESFilmicToneMapping` with exposure 1.08.
  - Lighting: Balanced three-point lighting rig (hemisphere overhead, directional key shadow light, rim light, fill light).
  - Mode Switcher: One-click toggle between `☀️ Studio` and `🌙 Dark` modes.
- **Fullscreen 3D Viewer**:
  - `⛶ Fullscreen 3D` button enters dedicated viewport mode (`100vw` x `100vh`, `zIndex: 9999`).
  - Seamless exit via `✕ Exit Fullscreen` button or `Escape` key.

---

## 4. Batch Domain Commands

### `autoFillBuild`
1. Resolves active case profile limits (`MINI_PC`, `SFF`, `MFF`, `LFF`).
2. Deterministically resolves and applies missing hardware:
   - Motherboard (`motherboard-01` or `motherboard-itx-01`)
   - CPU (`cpu-01`)
   - RAM sticks (`ram-01`, `ram-02` across DIMM slots)
   - GPU (compact `gpu-1fan-01` for Mini-ITX cases or high-power `gpu-01`)
   - PSU (`psu-01`)
   - Fans & default directions across empty fan mounts
   - Power cabling (ATX 24-pin and 12V 2x6 PCIe power)
3. Validates topology and logs a single summary `ActivityEntry`.

### `clearBuild`
1. Enforces `{ confirm: true }` parameter to prevent accidental deletion.
2. Removes all non-case components, fan directions, and power connections.
3. Preserves active case at `case-root`.
4. Emits a single summary `ActivityEntry`.

---

## 5. Automated Verification & Test Results

All 8 test suites and 52 tests pass with zero regressions.
Production build compiles with zero TypeScript errors.
