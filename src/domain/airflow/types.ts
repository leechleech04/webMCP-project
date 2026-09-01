export interface FanAirflowConfig {
  componentId: string;
  mountId: string;
  direction: "INTAKE" | "EXHAUST";
  cfm: number;
}

export interface AirflowStream {
  id: string;
  componentId: string;
  mountId: string;
  direction: "INTAKE" | "EXHAUST" | null;
  status: "active" | "unconfigured";
  color: string;
  start: [number, number, number];
  end: [number, number, number];
  particles: Array<{ position: [number, number, number]; speed: number }>;
  cfm: number;
}

export interface AirflowScene {
  streams: AirflowStream[];
  perFanStreams: AirflowStream[];
  intakeCount: number;
  exhaustCount: number;
  intakeCapacity: number;
  exhaustCapacity: number;
  balance: "positive" | "negative" | "balanced";
  unconfiguredFans: string[];
}
