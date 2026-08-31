# Stage 14 — Verified GLB integration

- Scope: reusable Drei `useGLTF` boundary, Suspense/error fallback, verified Lian Li case and Noctua fan integration, mount transform preservation, and asset provenance.
- Contracts consumed: `Placement.mountId → mountTransforms → modelRegistry`; visual mesh bounds are not compatibility truth.
- Implementation paths: `src/components/scene/GlbAsset.tsx`, `CaseModel.tsx`, `FanModel.tsx`, `modelRegistry.ts`, `mountTransforms.ts`, `public/assets/case-lian-li-lancool-216/`, and `public/assets/fan-noctua-nf-a12x25-g2-pwm/`.
- Tests/evidence: the loader is isolated behind an error-safe procedural fallback; build and scene tests pass; the asset hash is checked against the accepted source artifact.
- Known limitations: the Lian Li case and Noctua supporting fan are production GLBs. GPU, radiator, motherboard, and PSU remain clearly procedural fallbacks. The case is intentionally low-poly and its transparent side panel can still visually occlude dark interior parts at some camera angles.
- Deferred work: accept and integrate independently verified production GLBs for the remaining visible components; no unlicensed or rejected meshes are used.

## Asset table

| Component ID | Renderer | Source | License | Size / bounds | Attribution | Status |
|---|---|---|---|---:|---|---|
| `fan-top-01` → `FAN_NOCTUA_NF_A12X25_G2_PWM` | GLB | `public/assets/fan-noctua-nf-a12x25-g2-pwm/lod0.glb` | CC BY 4.0 | 343,448 B / 120×120×27 mm | `public/assets/fan-noctua-nf-a12x25-g2-pwm/ATTRIBUTION.md` | VERIFIED |
| `case-01` → `CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X` | GLB | `public/assets/case-lian-li-lancool-216/lod0.glb` | Original manual reconstruction; official specifications cited | 49,640 B / 235×491.7×480.9 mm | `public/assets/case-lian-li-lancool-216/ATTRIBUTION.md` | VERIFIED |
| `gpu-01` | Procedural fallback | `src/components/scene/GpuModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `radiator-01` | Procedural fallback | `src/components/scene/RadiatorModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `motherboard-01` | Procedural fallback | `src/components/scene/MotherboardModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `psu-01` | Procedural fallback | no visible model in current slice | In-house | n/a | n/a | PROCEDURAL_FALLBACK |

- Verdict: **PARTIAL**. The required all-production-GLB gate is intentionally not claimed.

## Case integration scale decision

The source GLB and its standalone viewer establish metre units and a native
`0.235 × 0.4917 × 0.4809` envelope. The app therefore applies a uniform `20`
scene-unit multiplier and raises the centred model by `4.917`, yielding
`4.7 × 9.834 × 9.618` scene units with its base on the floor. The copied source
manifest's `0.02` recommendation is not consumed because it contradicts its own
metre-unit declaration and arithmetic; the source artifact remains unchanged as
audit evidence.

The renderer also rotates the case `π` around Y because the actual
`Panel_Front_Mesh` geometry is on native `-Z`, contrary to the manifest's `+Z`
axis note. Mount transforms remain explicit app-owned coordinates: two embedded
anchor nodes (`radiator-front` and `pcie-slot-1`) point to the opposite side of
their named mesh regions, so consuming them blindly would misplace components.
The visual-only mount coordinates were realigned to the corrected case envelope;
logical Mount IDs and all Domain/Constraint behavior remain unchanged.
