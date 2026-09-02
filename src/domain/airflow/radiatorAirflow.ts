import type { ComponentDefinition } from "../types/component";

export const getIntegratedRadiatorFanCount = (
  component: ComponentDefinition | undefined,
): number => {
  if (!component || component.type !== "RADIATOR") return 0;
  return Math.min(
    3,
    Math.max(1, Math.round(component.dimensions.depth / component.dimensions.width)),
  );
};

export const getRadiatorAirflowDirection = (
  mountId: string,
): "INTAKE" | "EXHAUST" | undefined => {
  if (mountId === "radiator-front") return "INTAKE";
  if (mountId === "radiator-top") return "EXHAUST";
  return undefined;
};
