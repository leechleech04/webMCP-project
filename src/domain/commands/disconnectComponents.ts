import { commitDomainAction } from "./commitDomainAction";
import type { DomainTransitionOptions } from "./transition";

export const disconnectComponents = (
  connectionId: string,
  options: DomainTransitionOptions = {},
): string => commitDomainAction(
  { type: "DISCONNECT_COMPONENTS", connectionId },
  options,
).result as string;
