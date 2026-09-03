import { mmToSceneUnit } from "./units";

export interface SceneTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
}

export const RADIATOR_TOP_ROTATION: SceneTransform["rotation"] = [
  Math.PI / 2,
  0,
  0,
];

export const RADIATOR_FRONT_ROTATION: SceneTransform["rotation"] = [
  0,
  Math.PI,
  0,
];

const RADIATOR_CORE_THICKNESS_MM = 30;
const RADIATOR_PANEL_GAP_MM = 8;
const roundSceneUnit = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Places the radiator core just inside the case shell. RadiatorModel's local
 * Y axis is its long axis and local Z is its fan-facing normal:
 * - top: long axis follows case depth and fans face down into the case;
 * - front: long axis follows case height and fans face toward the case rear.
 */
export const createRadiatorMountTransforms = (dimensionsMm: {
  height: number;
  depth: number;
}): Record<"radiator-front" | "radiator-top", SceneTransform> => {
  const shellInset =
    mmToSceneUnit(RADIATOR_CORE_THICKNESS_MM) / 2 +
    mmToSceneUnit(RADIATOR_PANEL_GAP_MM);
  const caseHeight = mmToSceneUnit(dimensionsMm.height);
  const caseDepth = mmToSceneUnit(dimensionsMm.depth);

  return {
    "radiator-front": {
      position: [
        0,
        roundSceneUnit(caseHeight / 2),
        roundSceneUnit(caseDepth / 2 - shellInset),
      ],
      rotation: [...RADIATOR_FRONT_ROTATION],
    },
    "radiator-top": {
      position: [0, roundSceneUnit(caseHeight - shellInset), 0],
      rotation: [...RADIATOR_TOP_ROTATION],
    },
  };
};

const mffRadiatorTransforms = createRadiatorMountTransforms({
  height: 491.7,
  depth: 480.9,
});

export const mountTransforms: Readonly<Record<string, SceneTransform>> = {
  "case-root": {
    position: [0, 4.917, 0],
    rotation: [0, 0, 0],
  },
  "motherboard-tray": {
    position: [-1.38, 5.2, 0],
    rotation: [0, Math.PI / 2, 0],
  },
  "cpu-socket-1": {
    position: [-1.05, 6.1, -0.6],
    rotation: [0, Math.PI / 2, 0],
  },
  "cpu-cooler-1": {
    position: [-1.0, 6.15, -0.6],
    rotation: [0, Math.PI / 2, 0],
  },
  "dimm-a1": {
    position: [-1.05, 5.2, 1.65],
    rotation: [0, Math.PI / 2, 0],
  },
  "dimm-b1": {
    position: [-1.05, 5.2, 1.25],
    rotation: [0, Math.PI / 2, 0],
  },
  "pcie-slot-1": {
    position: [-0.5, 3, 0],
    rotation: [0, 0, 0],
  },
  "radiator-front": mffRadiatorTransforms["radiator-front"],
  "radiator-top": mffRadiatorTransforms["radiator-top"],
  "psu-bay": {
    position: [0, 1.2, 0],
    rotation: [0, 0, 0],
  },
  "fan-top-1": {
    position: [0, 9.55, 2],
    rotation: [Math.PI / 2, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-top-2": {
    position: [0, 9.55, -1.0],
    rotation: [Math.PI / 2, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-top-3": {
    position: [0, 9.55, 3.6],
    rotation: [Math.PI / 2, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-front-1": {
    position: [0, 5.5, 4.35],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-front-2": {
    position: [0, 2.5, 4.35],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-front-3": {
    position: [0, 7.2, 4.35],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-rear-1": {
    position: [0, 5.0, -4.7],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-bottom-1": {
    position: [0, 0.25, 1.0],
    rotation: [Math.PI / 2, 0, 0],
    scale: [1, 1, 1],
  },
  "storage-m2-1": {
    // Flush with the visible face of the motherboard. StorageModel's local Y
    // axis is its thickness, so the Z rotation makes that axis the board normal.
    position: [-1.0, 4.0, 0.6],
    rotation: [0, 0, Math.PI / 2],
    scale: [1, 1, 1],
  },
  "storage-2-5-1": {
    position: [1.0, 2.35, -1.55],
    rotation: [0, 0, 0],
  },
  "storage-3-5-1": {
    position: [0.7, 1.55, 1.9],
    rotation: [0, 0, 0],
  },
  "fan-bottom-2": {
    position: [0, 0.25, -1.4],
    rotation: [Math.PI / 2, 0, 0],
    scale: [1, 1, 1],
  },
  "fan-side-1": {
    position: [2.35, 4.5, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: [1, 1, 1],
  },
};

export const getMountTransform = (
  mountId: string,
): SceneTransform | undefined => mountTransforms[mountId];

export const getRequiredMountTransform = (mountId: string): SceneTransform => {
  const transform = getMountTransform(mountId);

  if (!transform) {
    throw new Error(`Missing scene transform for ${mountId}`);
  }

  return transform;
};
