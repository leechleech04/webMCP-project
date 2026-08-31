# Stage 14 — Verified GLB integration

- Scope: reusable Drei `useGLTF` boundary, Suspense/error fallback, verified Noctua fan integration, mount transform preservation, and asset provenance.
- Contracts consumed: `Placement.mountId → mountTransforms → modelRegistry`; visual mesh bounds are not compatibility truth.
- Implementation paths: `src/components/scene/GlbAsset.tsx`, `FanModel.tsx`, `modelRegistry.ts`, `mountTransforms.ts`, `public/assets/fan-noctua-nf-a12x25-g2-pwm/`.
- Tests/evidence: the loader is isolated behind an error-safe procedural fallback; build and scene tests pass; the asset hash is checked against the accepted source artifact.
- Known limitations: only the Noctua supporting fan is a production GLB. Case, GPU, radiator, motherboard, and PSU remain clearly procedural fallbacks. The verified GLB is 343,448 bytes with visual bounds 120 × 120 × 27 mm and CC BY 4.0 attribution.
- Deferred work: accept and integrate independently verified production GLBs for the remaining visible components; no unlicensed or rejected meshes are used.

## Asset table

| Component ID | Renderer | Source | License | Size / bounds | Attribution | Status |
|---|---|---|---|---:|---|---|
| `fan-top-01` → `FAN_NOCTUA_NF_A12X25_G2_PWM` | GLB | `public/assets/fan-noctua-nf-a12x25-g2-pwm/lod0.glb` | CC BY 4.0 | 343,448 B / 120×120×27 mm | `public/assets/fan-noctua-nf-a12x25-g2-pwm/ATTRIBUTION.md` | VERIFIED |
| `case-01` | Procedural fallback | `src/components/scene/CaseModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `gpu-01` | Procedural fallback | `src/components/scene/GpuModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `radiator-01` | Procedural fallback | `src/components/scene/RadiatorModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `motherboard-01` | Procedural fallback | `src/components/scene/MotherboardModel.tsx` | In-house | n/a | n/a | PROCEDURAL_FALLBACK |
| `psu-01` | Procedural fallback | no visible model in current slice | In-house | n/a | n/a | PROCEDURAL_FALLBACK |

- Verdict: **PARTIAL**. The required all-production-GLB gate is intentionally not claimed.
