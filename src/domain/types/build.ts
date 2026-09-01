import type { Connection } from "./connection";
import type { Placement } from "./placement";

export type FanDirection = "INTAKE" | "EXHAUST";

export interface FanConfig {
  componentId: string;
  direction: FanDirection;
  mountId?: string;
}

export type ActivityActor = "USER" | "AGENT" | "SYSTEM";

export interface ActivityEntry {
  id: string;
  actor: ActivityActor;
  message: string;
  createdAt: string;
  /** Components whose live topology changed during this activity. */
  affectedComponentIds?: string[];
  /** True only while this committed AGENT action is eligible for undo. */
  undoable?: boolean;
}

export interface BuildState {
  placements: Placement[];
  connections: Connection[];
  fanConfigs: FanConfig[];
  activity: ActivityEntry[];
}
