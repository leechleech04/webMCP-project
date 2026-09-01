export interface TelemetryEvent {
  kind: "registration" | "invocation";
  tool?: string;
  ok?: boolean;
  mode?: "webmcp" | "simulation" | "partial";
  error?: string;
  at: string;
}

export interface WebMcpTelemetry {
  readonly events: TelemetryEvent[];
  mode: "webmcp" | "simulation" | "partial";
  recordRegistration: (tool: string, ok: boolean, error?: string) => void;
  recordInvocation: (tool: string, ok: boolean, error?: string) => void;
}

export const createTelemetry = (): WebMcpTelemetry => {
  const events: TelemetryEvent[] = [];
  const add = (event: Omit<TelemetryEvent, "at">) => {
    events.push({ ...event, at: new Date().toISOString() });
  };
  return {
    events,
    mode: "simulation",
    recordRegistration: (tool, ok, error) => add({ kind: "registration", tool, ok, error }),
    recordInvocation: (tool, ok, error) => add({ kind: "invocation", tool, ok, error }),
  };
};
