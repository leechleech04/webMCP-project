export const SCENE_UNITS_PER_MM = 0.02;

export const mmToSceneUnit = (mm: number): number => mm * SCENE_UNITS_PER_MM;

export const envelopeScaleMm = (dimensionsMm: { width: number; height: number; depth: number }): [number, number, number] => [
  mmToSceneUnit(dimensionsMm.width),
  mmToSceneUnit(dimensionsMm.height),
  mmToSceneUnit(dimensionsMm.depth),
];
