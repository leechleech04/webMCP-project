import type { ComponentType } from "react";
import { GpuModel } from "../components/scene/GpuModel";
import { RadiatorModel } from "../components/scene/RadiatorModel";
import { FanModel } from "../components/scene/FanModel";
import { MotherboardModel } from "../components/scene/MotherboardModel";
import { PsuModel } from "../components/scene/PsuModel";
import { CpuModel } from "../components/scene/CpuModel";
import { RamModel } from "../components/scene/RamModel";
import type { SceneTransform } from "./mountTransforms";
import type { ComponentDefinition } from "../domain/types/component";

export interface SceneModelProps {
  transform: SceneTransform;
  highlight?: boolean;
  component?: ComponentDefinition;
}

export const modelRegistry: Readonly<
  Partial<Record<string, ComponentType<SceneModelProps>>>
> = {
  // GPUs
  "gpu-01": GpuModel,
  "gpu-2fan-01": GpuModel,
  "gpu-1fan-01": GpuModel,

  // Radiators
  "radiator-01": RadiatorModel,
  "radiator-240-01": RadiatorModel,
  "radiator-120-01": RadiatorModel,

  // Fans
  "fan-top-01": FanModel,
  "fan-front-01": FanModel,
  "fan-rear-01": FanModel,
  "fan-bottom-01": FanModel,
  "fan-side-01": FanModel,
  "fan-140-01": FanModel,
  "fan-160-01": FanModel,

  // Motherboards
  "motherboard-01": MotherboardModel,
  "motherboard-itx-01": MotherboardModel,

  // CPUs
  "cpu-01": CpuModel,

  // RAM
  "ram-01": RamModel,
  "ram-02": RamModel,
  "ram-03": RamModel,

  // PSUs
  "psu-01": PsuModel,
  "psu-sfx-01": PsuModel,
};

export const getSceneModel = (
  componentId: string,
): ComponentType<SceneModelProps> | undefined => modelRegistry[componentId];
