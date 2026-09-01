import type { Connection } from "../types/connection";
import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";

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
  const transition = commitDomainAction(
    { type: "CONNECT_COMPONENTS", ...input },
    options,
  );
  return transition.result as Connection;
};
