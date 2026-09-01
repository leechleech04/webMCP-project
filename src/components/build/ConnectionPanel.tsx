import { useMemo, useState } from "react";
import { connectComponents } from "../../domain/commands/connectComponents";
import { disconnectComponents } from "../../domain/commands/disconnectComponents";
import { componentRegistry } from "../../domain/data/components";
import { useLanguage } from "../../i18n/LanguageContext";
import { useBuildStore } from "../../store/buildStore";

export function ConnectionPanel() {
  const { t, componentName } = useLanguage();
  const placements = useBuildStore((state) => state.placements);
  const connections = useBuildStore((state) => state.connections);
  const [error, setError] = useState<string | null>(null);
  const installedIds = useMemo(() => new Set(placements.map((placement) => placement.componentId)), [placements]);
  const occupiedInputs = useMemo(() => new Set(connections.map((connection) => `${connection.to.componentId}:${connection.to.connectorId}`)), [connections]);
  const occupiedOutputs = useMemo(() => new Set(connections.map((connection) => `${connection.from.componentId}:${connection.from.connectorId}`)), [connections]);

  const suggestions = useMemo(() => {
    const installed = Object.values(componentRegistry).filter((component) => installedIds.has(component.id));
    return installed.flatMap((source) =>
      (source.connectors ?? []).filter((connector) => connector.direction === "OUTPUT" && !occupiedOutputs.has(`${source.id}:${connector.id}`)).flatMap((output) =>
        installed.flatMap((target) =>
          (target.connectors ?? [])
            .filter((input) => input.direction === "INPUT" && input.type === output.type && !occupiedInputs.has(`${target.id}:${input.id}`))
            .map((input) => ({ source, output, target, input })),
        ),
      ),
    );
  }, [installedIds, occupiedInputs, occupiedOutputs]);

  return (
    <section className="connection-panel" aria-labelledby="connection-title">
      <div className="build-actions-heading">
        <h3 id="connection-title">{t("connections.title")}</h3>
        <span>{connections.length}</span>
      </div>
      {suggestions.length === 0 && connections.length === 0 && <p className="empty-state">{t("connections.empty")}</p>}
      <div className="connection-list">
        {suggestions.slice(0, 6).map(({ source, output, target, input }) => (
          <button
            type="button"
            className="secondary connection-action"
            key={`${source.id}:${output.id}:${target.id}:${input.id}`}
            onClick={() => {
              try {
                connectComponents({
                  fromComponentId: source.id,
                  fromConnectorId: output.id,
                  toComponentId: target.id,
                  toConnectorId: input.id,
                });
                setError(null);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : String(caught));
              }
            }}
          >
            <span>{componentName(source.id, source.name)} → {componentName(target.id, target.name)}</span>
            <small>{output.type}</small>
          </button>
        ))}
        {connections.map((connection) => (
          <div className="connection-existing" key={connection.id}>
            <span>{componentName(connection.from.componentId, componentRegistry[connection.from.componentId]?.name ?? connection.from.componentId)} → {componentName(connection.to.componentId, componentRegistry[connection.to.componentId]?.name ?? connection.to.componentId)}</span>
            <button type="button" onClick={() => disconnectComponents(connection.id)}>{t("connections.disconnect")}</button>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="connection-error">{error}</p>}
    </section>
  );
}
