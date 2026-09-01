import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";

export interface SetFanDirectionInput {
  componentId: string;
  direction: "INTAKE" | "EXHAUST";
}

export const setFanDirection = (
  input: SetFanDirectionInput,
  options: DomainTransitionOptions = {},
) => {
  const transition = commitDomainAction(
    { type: "SET_FAN_DIRECTION", ...input },
    options,
  );
  return transition.result;
};
