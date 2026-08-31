import type { ComponentType } from "react";

import { GpuModel } from "../components/scene/GpuModel";
import { RadiatorModel } from "../components/scene/RadiatorModel";
import type { SceneTransform } from "./mountTransforms";

export interface SceneModelProps {
  transform: SceneTransform;
}

export const modelRegistry: Readonly<
  Partial<Record<string, ComponentType<SceneModelProps>>>
> = {
  "gpu-01": GpuModel,
  "radiator-01": RadiatorModel,
};

export const getSceneModel = (
  componentId: string,
): ComponentType<SceneModelProps> | undefined => modelRegistry[componentId];
