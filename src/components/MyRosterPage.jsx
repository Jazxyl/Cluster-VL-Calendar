import { formatUSDate } from '../lib/dates.js';

export default function MyRosterPage({ agents }) {
  return (
    <div className="card home-section">
      <p className="home-section-title">Your agents ({agents.length})</p>
      {agents.length === 0 ? (
        <p className="empty-note">No agents assigned to you yet.</p>
      ) : (
        agents.map((a, i) => (
          <div className="hist-row" key={i}>
            <span className="who">{a.name}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{a.hubstaffId || 'No Hubstaff ID'}</span>
            <span className="hist-when">{a.date ? formatUSDate(a.date) : 'No date on file'}</span>
          </div>
        ))
      )}
    </div>
  );
}
