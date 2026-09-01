import { connectComponents } from "../../domain/commands/connectComponents";
import { componentRegistry } from "../../domain/data/components";
import { useBuildStore } from "../../store/buildStore";

const recipes = [
  ["psu-01", "psu-atx-01", "motherboard-01", "motherboard-atx", "ATX 24-pin"],
  ["psu-01", "psu-eps-01", "motherboard-01", "motherboard-eps", "CPU EPS"],
  ["psu-01", "psu-gpu-01", "gpu-01", "gpu-power", "GPU power"],
  ["motherboard-01", "fan-header-1", "fan-top-01", "fan-pwm", "Fan PWM"],
  ["motherboard-01", "argb-header-1", "fan-top-01", "fan-argb", "Fan ARGB"],
] as const;

export function BuildTree({ onMessage }: { onMessage?: (message: string) => void }) {
  const placements = useBuildStore((state) => state.placements);
  const connections = useBuildStore((state) => state.connections);
  const installed = new Set(placements.map((item) => item.componentId));
  return <section className="tree-panel" aria-labelledby="tree-title">
    <div className="panel-heading"><div><h2 id="tree-title">Build tree & headers</h2><p className="panel-caption">Topology and physical signal paths share the same store.</p></div><span className="activity-count">{connections.length}</span></div>
    <ul className="build-tree">{placements.map((placement) => <li key={placement.componentId}><strong>{componentRegistry[placement.componentId]?.name ?? placement.componentId}</strong><span>{placement.mountId}</span></li>)}</ul>
    <div className="connection-recipes">{recipes.map(([fromId, fromConnector, toId, toConnector, label]) => {
      const connected = connections.some((item) => item.from.componentId === fromId && item.from.connectorId === fromConnector && item.to.componentId === toId && item.to.connectorId === toConnector);
      const available = installed.has(fromId) && installed.has(toId);
      return <button key={label} type="button" className={connected ? "connection-done" : "secondary"} disabled={!available || connected} onClick={() => { try { connectComponents({ fromComponentId: fromId, fromConnectorId: fromConnector, toComponentId: toId, toConnectorId: toConnector }); onMessage?.(`${label} connected`); } catch (error) { onMessage?.(error instanceof Error ? error.message : "Connection failed"); } }}>{connected ? "Connected" : "Connect"} · {label}</button>;
    })}</div>
  </section>;
}
