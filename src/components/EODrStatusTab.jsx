import { useState } from 'react';
import { todayPST } from '../lib/dates.js';

export default function EODrStatusTab({ leads, eodEntries }) {
  const [selectedDate, setSelectedDate] = useState(todayPST());

  const submittedNames = new Set(
    eodEntries
      .filter((e) => e.date === selectedDate)
      .map((e) => e.lead.toLowerCase().trim())
  );

  const rows = leads.map((l) => ({
    ...l,
    submitted: submittedNames.has(l.name.toLowerCase().trim()),
  }));
  const submittedCount = rows.filter((r) => r.submitted).length;

  return (
    <div className="card home-section">
      <div className="field" style={{ maxWidth: 220 }}>
        <label>Date</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 12px' }}>
        {submittedCount} / {leads.length} submitted
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
