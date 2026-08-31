import { buildStore } from "../../store/buildStore";
import type { Connection } from "../types/connection";
import { applyDomainAction, type DomainTransitionOptions } from "./transition";

export interface ConnectComponentsInput {
  fromComponentId: string;
  fromConnectorId: string;
  toComponentId: string;
  toConnectorId: string;
}

export const connectComponents = (
  input: ConnectComponentsInput,
  options: DomainTransitionOptions = {},
): Connection => {
  const transition = applyDomainAction(
    buildStore.getState(),
    { type: "CONNECT_COMPONENTS", ...input },
    options,
  );
  buildStore.setState(transition.state);
  return transition.result as Connection;
};
