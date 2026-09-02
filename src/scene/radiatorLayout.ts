import type { Dimensions } from "../domain/types/component";
import { mmToSceneUnit } from "./units";

export interface RadiatorLayout {
  width: number;
  length: number;
  thickness: number;
  fanCount: number;
  fanSize: number;
  fanOffsets: number[];
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

/** Derives all visible radiator dimensions from the component's mm contract. */
export const getRadiatorLayout = (dimensions: Dimensions): RadiatorLayout => {
  const width = mmToSceneUnit(dimensions.width);
  const length = mmToSceneUnit(dimensions.depth);
  const thickness = mmToSceneUnit(dimensions.height);
  const fanCount = clamp(Math.round(length / width), 1, 3);
  const fanSize = width * 0.96;

  return {
    width,
    length,
    thickness,
    fanCount,
    fanSize,
    fanOffsets: Array.from(
      { length: fanCount },
      (_, index) => (index - (fanCount - 1) / 2) * width,
    ),
  };
};
