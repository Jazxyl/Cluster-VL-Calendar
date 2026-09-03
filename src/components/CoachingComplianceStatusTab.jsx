export default function CoachingComplianceStatusTab({ entries, isAdmin, currentUserName }) {
  const list = isAdmin
    ? entries
    : entries.filter((e) => (e.tl || '').toLowerCase().trim() === (currentUserName || '').toLowerCase().trim());

  const sorted = [...list].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  return (
    <div className="card home-section">
      <p className="home-section-title">{isAdmin ? 'All coaching sessions' : 'Your coaching sessions'}</p>
      {sorted.length === 0 ? (
        <p className="empty-note">Nothing logged yet.</p>
      ) : (
        sorted.map((e, i) => (
          <div className="hist-row" key={i}>
            <span className="badge approved">{e.type}</span>
            <span className="who">
              {e.agent}
              {isAdmin ? <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-soft)' }}>{e.tl}</span> : null}
            </span>
            <a href={e.fathomLink} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>
              Recording
            </a>
          </div>
        ))
      )}
    </div>
  );
}
