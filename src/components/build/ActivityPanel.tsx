import { useBuildStore } from "../../store/buildStore";
import { canUndoLastAgentAction, undoLastAgentAction } from "../../domain/commands/commitDomainAction";

export function ActivityPanel() {
  const activity = useBuildStore((state) => state.activity);

  return (
    <section className="activity-panel" aria-labelledby="activity-title">
      <div className="panel-heading">
        <div>
          <h2 id="activity-title">Activity timeline</h2>
          <p className="panel-caption">One ordered audit trail for human and agent actions.</p>
        </div>
        <div className="activity-actions"><button type="button" className="secondary" disabled={!canUndoLastAgentAction()} onClick={() => undoLastAgentAction()}>Undo agent</button><span className="activity-count">{activity.length}</span></div>
      </div>
      {activity.length === 0 ? (
        <p className="empty-state">No activity yet. Install a component to begin.</p>
      ) : (
        <ol className="activity-list">
          {activity.map((entry) => (
            <li key={entry.id}>
              <span className={`actor-badge actor-${entry.actor.toLowerCase()}`}>{entry.actor}</span>
              <span className="activity-message">{entry.message}</span>
              <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
