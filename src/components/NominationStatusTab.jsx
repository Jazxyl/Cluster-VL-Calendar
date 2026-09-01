import { todayPST, currentMonthKey } from '../lib/dates.js';

export default function NominationStatusTab({ leads, nominations }) {
  const thisMonth = currentMonthKey(todayPST());

  const submittedNames = new Set(
    nominations
      .filter((n) => n.month === thisMonth)
      .map((n) => n.tl.toLowerCase().trim())
  );

  const rows = leads.map((l) => ({
    ...l,
    submitted: submittedNames.has(l.name.toLowerCase().trim()),
  }));
  const submittedCount = rows.filter((r) => r.submitted).length;

  return (
    <div className="card home-section">
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 12px' }}>
        {submittedCount} / {leads.length} submitted this month
      </p>
      {leads.length === 0 ? (
        <p className="empty-note">No team leads on file.</p>
      ) : (
        rows.map((r) => (
          <div className="hist-row" key={r.id}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {r.submitted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#69C920" strokeWidth="3">
                  <path d="M4 12l6 6L20 6" />
                </svg>
              ) : (
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #c2c7d6', display: 'inline-block' }} />
              )}
              <span className="who" style={{ flex: 'none', color: r.submitted ? 'var(--ink)' : 'var(--ink-soft)' }}>
                {r.name}
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
