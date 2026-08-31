export interface SceneTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
}

export const mountTransforms: Readonly<Record<string, SceneTransform>> = {
  "motherboard-tray": {
    position: [-2, 5, 0],
    rotation: [0, Math.PI / 2, 0],
  },
  "pcie-slot-1": {
    position: [-0.5, 3, 0],
    rotation: [0, 0, 0],
  },
  "radiator-front": {
    position: [0, 4.9, 4.35],
    rotation: [0, 0, Math.PI / 2],
  },
  "radiator-top": {
    position: [0, 9.3, 0],
    rotation: [Math.PI / 2, 0, Math.PI / 2],
  },
  "fan-top-1": {
    position: [0, 9.55, 2],
    rotation: [0, 0, 0],
    scale: [0.012, 0.012, 0.012],
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
