import type { ComponentType } from "react";
import { GpuModel } from "../components/scene/GpuModel";
import { RadiatorModel } from "../components/scene/RadiatorModel";
import { FanModel } from "../components/scene/FanModel";
import { MotherboardModel } from "../components/scene/MotherboardModel";
import { PsuModel } from "../components/scene/PsuModel";
import { CpuModel } from "../components/scene/CpuModel";
import { RamModel } from "../components/scene/RamModel";
import { StorageModel } from "../components/scene/StorageModel";
import type { SceneTransform } from "./mountTransforms";
import type { ComponentDefinition, ComponentType as DomainComponentType } from "../domain/types/component";
import { componentRegistry } from "../domain/data/components";
import { SharedGlbModel } from "../components/scene/SharedGlbModel";
import { AirCoolerModel } from "../components/scene/AirCoolerModel";

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
  "radiator-280-01": RadiatorModel,

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

  // Storage
  "storage-nvme-01": StorageModel,
  "storage-nvme-heatsink": StorageModel,

  // PSUs
  "psu-01": PsuModel,
  "psu-sfx-01": PsuModel,
};

/**
 * Keep procedural rendering available for every component family even when a
 * catalog entry was added without an explicit ID registration. Catalog growth
 * should never result in a successfully installed but invisible component.
 */
const proceduralModelByType: Readonly<
  Partial<Record<DomainComponentType, ComponentType<SceneModelProps>>>
> = {
  MOTHERBOARD: MotherboardModel,
  CPU: CpuModel,
  GPU: GpuModel,
  RAM: RamModel,
  STORAGE: StorageModel,
  RADIATOR: RadiatorModel,
  FAN: FanModel,
  PSU: PsuModel,
  CPU_COOLER: AirCoolerModel,
};

export const getSceneModel = (
  componentId: string,
): ComponentType<SceneModelProps> | undefined => {
  const component = componentRegistry[componentId];
  if (component?.type === "CPU_COOLER") return AirCoolerModel;
  if (component?.visualAsset?.mode === "GLB" && component.visualAsset.url) {
    return SharedGlbModel;
  }
  return modelRegistry[componentId] ?? (component ? proceduralModelByType[component.type] : undefined);
};
