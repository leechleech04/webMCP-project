# ATTRIBUTION — Lian Li Lancool 216 (SyncBuild 3D Asset R1)

## Component Information
- **Component ID:** CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X
- **Commercial Model:** Lian Li Lancool 216
- **Category:** CASE
- **Asset Tier:** PRODUCTION
- **Manufacturer Part Number:** LANCOOL 216X
- **Brand:** Lian Li
- **Frozen External Dimensions:** 235 × 491.7 × 480.9 mm (width × height × depth)
- **Coordinate System:** GLTF_Y_UP
- **Bounds Order:** [widthX, heightY, depthZ]
- **Anchor:** CENTER at [0,0,0]
- **Production Method:** MANUAL_DETERMINISTIC_RECONSTRUCTION
- **Source Classification:** REFERENCE_ONLY (no redistributed third-party geometry)
- **GLB Files:** lod0.glb (49,640 bytes, 564 tris), lod1.glb (40,024 bytes, 372 tris), lod2.glb (37,612 bytes, 324 tris)
- **Units:** metres in glTF, millimetres in validation report

---

## Source & License Summary

### Official Specification Source (Reference Only, Not Redistributed)
- **Title:** Lancool 216 — Official Product Page and Spec Table
- **Publisher / Rightsholder:** Lian Li Industrial Co., Ltd.
- **URL:** [https://lian-li.com/product/lancool-216/](https://lian-li.com/product/lancool-216/)
- **Access Date:** 2026-09-01 (KST)
- **Evidence Extracted:**
  - `DIMENSION (D)480.9 x (W)235 x (H)491.7 mm`
  - `GPU LENGTH CLEARANCE 392 mm`
  - `Water Cooling: Front radiator 240,280,360 mm; Top radiator 240,280,360 mm (63mm top gap)`
  - `Motherboard Support E-ATX (width under 280mm)/ATX/M-ATX/ITX`
  - `PSU Support ATX 220mm`
- **License:** Copyrighted, All Rights Reserved. Product page and photographs are not licensed for redistribution.
- **Permitted Use in this Asset:** Dimensional numbers (facts) used as frozen catalog values; photographs used strictly as visual reference to inform manual geometric reconstruction. No photography, logos, or regulatory labels are embedded in the GLB, textures, or attribution package. This is not a derivative of copyrighted photography; it is an original low-poly interpretation guided by factual dimensions.
- **Redistribution Status of Source:** Source page not redistributed. Only factual dimensions are cited under nominative fair use.

### Licensed 3D Model Search (Negative Result)
- **Local System Search:** `D:\컴퓨터 조립` and `D:\Game development\Demon slayer` — recursive search for `*.glb/*.obj/*.blend/*.fbx` containing `lancool` or `216` — **0 results**.
- **GitHub Search:** `Lian Li Lancool 216 3D model Blender glTF licensed` — no full chassis model with explicit CC0/CC-BY/MIT/Apache license. Partial accessories only (Printables bottom plates GPL v2, vent blockers) — **not used**.
- **Wikimedia Commons:** `site:commons.wikimedia.org Lian Li Lancool 216` — no dedicated free image; Category:Lian_Li exists but contains no Lancool 216 geometry; video `I9 14900K - ASUS TUF GAMING RTX4090 24G - LIAN LI 216 - INVADERPC.webm` is CC BY 3.0/4.0 via YouTube but is a build video, not geometry — **not used**.
- **Conclusion:** No properly licensed full Lancool 216 3D model exists. Production therefore uses **Manual Deterministic Reconstruction**.

---

## Disclosure of Production Method & Transformations

1. **Source Search Order Followed:** Local → GitHub → Wikimedia Commons → Official product pages/manuals → General photographs (reference only). All steps logged in `evidence/source_verdict.json`.

2. **No Licensed Geometry Reuse:** No third-party mesh, texture, or material was copied, retopologized, or embedded. All geometry is original.

3. **Deterministic Blender Reconstruction (Blender 5.2.0 LTS):**
   - Units metres, built to exact frozen bounds 0.235×0.4917×0.4809 m with **CENTER** origin, verified to ±0.001 mm after GLB round-trip.
   - Recognizable subassemblies modeled as separate watertight or thin-panel manifolds with real thickness:
     - Structural chassis frame (bottom, top, right opaque panel)
     - Front mesh region (dark mesh material, full-width front panel)
     - Front fan/radiator mounting bracket (Brackets `Bracket_Radiator_Front`)
     - Top radiator mounting region (`Grill_Top_Radiator` below top panel)
     - Motherboard tray (`Tray_Motherboard`)
     - PCIe rear-slot region (`PCIe_Slot_Region`)
     - PSU shroud (`Shroud_PSU`) and PSU bay (`Bay_PSU`)
     - Feet (4× `Feet_*` rubber)
     - Rear panel structure (`Panel_Rear`)
     - Separate left side transparent tempered-glass (`Glass_Side_Panel` with transmission 1.0, alpha 0.25) for interior visibility; also available as open-side by toggling visibility.
   - Interior remains visible through transparent side; not a solid blocked box.
   - Front fans: two simplified 160mm fan cylinders behind front mesh (visual hint, not detailed blades) and one rear 120mm fan — low-poly, restrained.
   - Materials: 11 Principled BSDF materials (shared where possible) — dark painted metal, dark mesh, transparent glass, rubber feet, tray/PSU/shroud/grill variants — all procedural colors, **0 textures**, max 2048 limit satisfied trivially.
   - Thin panels have real thickness (2mm metal, 4mm glass) — no zero-thickness planes.

4. **Coordinate & Anchor Contract (GLTF_Y_UP, CENTER):**
   - Export `export_yup=True`, `export_apply=True`; verified round-trip.
   - Bounds order `[widthX, heightY, depthZ]`, anchor `CENTER`, units metres in glTF.
   - Centroid tolerance ±0.5 mm (actual <0.001 mm).
   - External bounds tolerance LOD0 ±1.0 mm, LOD1 ±1.0 mm, LOD2 ±1.5 mm (actual 0.0 mm error).
   - Named mount anchors (empty nodes) with exact names:
     - `MOUNT::motherboard-tray` [0.07, 0.02, -0.01] VISUAL_ESTIMATE ±5 mm
     - `MOUNT::pcie-slot-1` [0.04, -0.02, -0.22] VISUAL_ESTIMATE ±5 mm
     - `MOUNT::radiator-front` [0.0, 0.02, 0.18] VISUAL_ESTIMATE ±5 mm
     - `MOUNT::radiator-top` [0.0, 0.22, 0.0] VISUAL_ESTIMATE ±5 mm
     - `MOUNT::psu-bay` [0.0, -0.18, -0.14] VISUAL_ESTIMATE ±5 mm
     - `MOUNT::fan-top-1` [0.0, 0.22, 0.10] VISUAL_ESTIMATE ±5 mm
   - All anchors preserved across LODs, stable to ±0.001 mm after decimation.
   - No millimetre precision claimed for photograph-derived internal anchors.

5. **LOD System:**
   - LOD0: 564 tris, 49,640 bytes, fan cylinder 32-seg
   - LOD1: 372 tris, 40,024 bytes, fan cylinder 16-seg
   - LOD2: 324 tris, 37,612 bytes, fan cylinder 12-seg
   - All LODs share same external bounds (±0.0 mm), same anchor names/transforms, no degenerate faces, no unexpected floaters, no missing structural section, side-panel separability preserved.

6. **Web Rendering Contract:**
   - Loads with `useGLTF` without Draco; no remote decoder; no absolute texture paths; loads from `/public/assets/` after copy; deterministic node names; side-panel visibility by `Glass_Side_Panel`; `meshStandardMaterial` only; no custom Blender runtime; mounts preserved after round-trip.
   - Recommended transform `position [0,4.5,0] rotation [0,0,0] scale [0.02,0.02,0.02]` → at 0.02 yields 4.7×9.83×9.61 scene units vs ~10×9×10 envelope; alternative scale 0.019 yields 4.46×9.34×9.13.

7. **Procedural Fallback:** Available — centered box 235×491.7×480.9mm with dark front panel and transparent side if GLB fails.

8. **Not Endorsed:** This asset is an independent original interpretation for SyncBuild visualization. Not endorsed by Lian Li or photographers. No trademarks or regulatory labels reproduced.

---

## Software & Evidence Provenance
- **Modeling & Export:** Blender 5.2.0 LTS `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`
- **Validation:** Trimesh 5.1.0, Python 3.11.15, NumPy, SciPy
- **Verification:** Deterministic bounds/centroid/triangle/file-size/anchor/material/texture/node naming/side-panel/degenerate/manifold checks
- **Evidence Files:**
  - `D:\컴퓨터 조립\.workflow\scratch\asset_builds\CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X\r1\evidence\source_verdict.json`
  - `D:\컴퓨터 조립\.workflow\scratch\asset_builds\CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X\r1\final\manifest.json`
  - `D:\컴퓨터 조립\.workflow\scratch\asset_builds\CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X\r1\final\validation_report.json`
  - `D:\컴퓨터 조립\.workflow\scratch\asset_builds\CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X\r1\scripts\build_case_fixed.py`

---

## Redistribution & Attribution Obligations
- **This Asset:** Original geometry, no third-party CC obligations. You may redistribute the GLBs under SyncBuild project terms. Cite Lian Li as design reference; do not imply endorsement.
- **Official Lian Li Content:** Not redistributed. Do not copy Lian Li photography, logos, or manuals into derivatives.
- **No Embedded Third-Party Textures/Photos:** None.

---

## Frozen Catalog Reference
- **Catalog Version:** CATALOG_FREEZE_V1 `2026-08-31T19:30:00+09:00`
- **Component:** `CASE_LIAN_LI_LANCOOL_216_LANCOOL_216X` — LANCOOL 216X — `235x491.7x480.9` — `gpuMaximum 392` — `front/top radiator up to 360`
- **Provenance Index:** `https://lian-li.com/product/lancool-216/` (OFFICIAL_PRODUCT_PAGE)
