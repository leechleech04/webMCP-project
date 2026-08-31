export interface SceneTransform {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const mountTransforms: Readonly<Record<string, SceneTransform>> = {
  "motherboard-tray": {
    position: [-1, 4.2, -4.35],
  },
  "pcie-slot-1": {
    position: [-1, 2.6, -0.15],
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
