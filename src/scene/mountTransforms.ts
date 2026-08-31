export interface SceneTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
}

export const mountTransforms: Readonly<Record<string, SceneTransform>> = {
  "motherboard-tray": {
    position: [-1, 4.2, -4.35],
    rotation: [0, 0, 0],
  },
  "pcie-slot-1": {
    position: [-1, 2.6, -0.15],
    rotation: [0, 0, 0],
  },
  "radiator-front": {
    position: [4.45, 4.45, 0],
    rotation: [0, 0, Math.PI / 2],
  },
  "radiator-top": {
    position: [0, 8.35, 0],
    rotation: [Math.PI / 2, 0, 0],
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
