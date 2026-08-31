import { buildStore } from "../../store/buildStore";
import { applyDomainAction, type DomainTransitionOptions } from "./transition";

export interface SetFanDirectionInput {
  componentId: string;
  direction: "INTAKE" | "EXHAUST";
}

export const setFanDirection = (
  input: SetFanDirectionInput,
  options: DomainTransitionOptions = {},
) => {
  const transition = applyDomainAction(
    buildStore.getState(),
    { type: "SET_FAN_DIRECTION", ...input },
    options,
  );
  buildStore.setState(transition.state);
  return transition.result;
};
