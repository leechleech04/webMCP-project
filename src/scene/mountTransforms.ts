export interface SceneTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
}

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
  "radiator-front": {
    position: [0, 4.9, 4.35],
    rotation: [0, 0, 0],
  },
  "radiator-top": {
    position: [0, 9.3, 0],
    rotation: [Math.PI / 2, 0, 0],
  },
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
    position: [-0.25, 4.0, 0.6],
    rotation: [0, 0, Math.PI / 2],
    scale: [1, 1, 1],
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
