import { formatUSDate } from '../lib/dates.js';

export default function MyRosterPage({ agents }) {
  return (
    <div className="card home-section">
      <p className="home-section-title">Your agents ({agents.length})</p>
      {agents.length === 0 ? (
        <p className="empty-note">No agents assigned to you yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, padding: '4px 0 8px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ flex: 1, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)' }}>
              Name
            </span>
            <span style={{ width: 110, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)' }}>
              Hubstaff ID
            </span>
            <span style={{ width: 90, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)', textAlign: 'right' }}>
              Start date
            </span>
          </div>
          {agents.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>{a.name}</span>
              <span style={{ width: 110, fontSize: 12, color: 'var(--ink-soft)' }}>{a.hubstaffId || '—'}</span>
              <span style={{ width: 90, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-soft)', textAlign: 'right' }}>
                {a.date ? formatUSDate(a.date) : '—'}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
