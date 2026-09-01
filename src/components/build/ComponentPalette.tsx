import { installComponent } from "../../domain/commands/installComponent";
import { moveComponent } from "../../domain/commands/moveComponent";
import { removeComponent } from "../../domain/commands/removeComponent";
import { setFanDirection } from "../../domain/commands/setFanDirection";
import { components } from "../../domain/data/components";
import { mounts } from "../../domain/data/mounts";
import { useBuildStore } from "../../store/buildStore";

export function ComponentPalette({ onMessage }: { onMessage?: (message: string) => void }) {
  const placements = useBuildStore((state) => state.placements);
  const fanConfigs = useBuildStore((state) => state.fanConfigs);
  const run = (work: () => void, message: string) => { try { work(); onMessage?.(message); } catch (error) { onMessage?.(error instanceof Error ? error.message : "Command failed"); } };
  return <section className="palette-panel" aria-labelledby="palette-title">
    <div className="panel-heading"><div><h2 id="palette-title">Component palette</h2><p className="panel-caption">Every catalog item and compatible mount is actionable.</p></div></div>
    <div className="palette-list">{components.map((component) => {
      const placement = placements.find((item) => item.componentId === component.id);
      const compatible = mounts.filter((mount) => mount.supportedComponentTypes.includes(component.type));
      const fixed = component.type === "CASE" || component.type === "MOTHERBOARD";
      const fanDirection = fanConfigs.find((item) => item.componentId === component.id)?.direction;
      return <article className="palette-item" key={component.id}>
        <div><strong>{component.name}</strong><span>{component.type} · {component.dataConfidence === "DEMO" ? "DEMO DATA" : "SOURCED"}</span></div>
        <div className="mini-actions">
          {compatible.map((mount) => <button key={mount.id} type="button" className="secondary" disabled={placement?.mountId === mount.id || (!placement && placements.some((item) => item.mountId === mount.id))} onClick={() => run(() => placement ? moveComponent({ componentId: component.id, mountId: mount.id }) : installComponent({ componentId: component.id, mountId: mount.id }), `${component.name} → ${mount.id}`)}>{placement ? "Move" : "Install"} {mount.id}</button>)}
          {component.type === "FAN" && placement && <button type="button" onClick={() => run(() => setFanDirection({ componentId: component.id, direction: fanDirection === "INTAKE" ? "EXHAUST" : "INTAKE" }), `Fan direction updated`)}>{fanDirection ?? "Set intake"}</button>}
          {placement && !fixed && <button type="button" className="secondary" onClick={() => run(() => removeComponent({ componentId: component.id }), `${component.name} removed`)}>Remove</button>}
        </div>
      </article>;
    })}</div>
    <p className="truth-note">Demo catalog values are deterministic challenge fixtures, not purchasing advice. Sourced assets retain attribution.</p>
  </section>;
}
