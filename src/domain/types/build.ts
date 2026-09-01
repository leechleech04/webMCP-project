import type { Connection } from "./connection";
import type { Placement } from "./placement";

export type FanDirection = "INTAKE" | "EXHAUST";

export interface FanConfig {
  componentId: string;
  direction: FanDirection;
}

export type ActivityActor = "USER" | "AGENT" | "SYSTEM";

export interface ActivityEntry {
  id: string;
  actor: ActivityActor;
  message: string;
  createdAt: string;
  affectedComponentIds?: string[];
  undoable?: boolean;
}

export interface BuildState {
  placements: Placement[];
  connections: Connection[];
  fanConfigs: FanConfig[];
  activity: ActivityEntry[];
}
