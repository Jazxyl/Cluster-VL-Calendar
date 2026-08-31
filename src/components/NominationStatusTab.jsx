import { monthKeyLabel } from '../lib/dates.js';

export default function NominationStatusTab({ nominations, isAdmin, currentUserName }) {
  if (isAdmin) {
    const byMonth = {};
    nominations.forEach((n) => {
      if (!byMonth[n.month]) byMonth[n.month] = [];
      byMonth[n.month].push(n);
    });
    const monthKeys = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

    return (
      <div>
        {monthKeys.length === 0 ? (
          <div className="card home-section">
            <p className="home-section-title">Nominations</p>
            <p className="empty-note">No nominations submitted yet.</p>
          </div>
        ) : (
          monthKeys.map((mk) => (
            <div className="card home-section" key={mk}>
              <p className="home-section-title">
                {monthKeyLabel(mk)} ({byMonth[mk].length})
              </p>
              {byMonth[mk].map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 0',
                    borderBottom: i < byMonth[mk].length - 1 ? '0.5px solid var(--line)' : 'none',
                  }}
                >
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {n.agent} <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>· {n.client}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)' }}>{n.reason}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-soft)' }}>Nominated by {n.tl}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    );
  }

  const mine = nominations.filter(
    (n) => n.tl.toLowerCase().trim() === (currentUserName || '').toLowerCase().trim()
  );
  const sorted = mine.sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="card home-section">
      <p className="home-section-title">Your nominations</p>
      {sorted.length === 0 ? (
        <p className="empty-note">You haven't nominated anyone yet.</p>
      ) : (
        sorted.map((n, i) => (
          <div
            key={i}
            style={{ padding: '8px 0', borderBottom: i < sorted.length - 1 ? '0.5px solid var(--line)' : 'none' }}
          >
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              {monthKeyLabel(n.month)} — {n.agent} <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>· {n.client}</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)' }}>{n.reason}</p>
          </div>
        ))
      )}
    </div>
  );
}
