import { useState } from 'react';
import { todayPST, mondaysInMonth, monthLabel, formatWeekLabel } from '../lib/dates.js';

export default function AdminTrackerTab({ leads, eodEntries, eowrEntries }) {
  const todayStr = todayPST();
  const [eodrDate, setEodrDate] = useState(todayStr);
  const [monthCursor, setMonthCursor] = useState(() => { const [y, m] = todayStr.split('-'); return { year: Number(y), month: Number(m) }; });
  const [expandedWeek, setExpandedWeek] = useState(null);

  const submittedEodr = new Set(eodEntries.filter((e) => e.date === eodrDate).map((e) => e.lead.toLowerCase().trim()));
  const eodrPending = leads.filter((l) => !submittedEodr.has(l.name.toLowerCase().trim()));
  const eodrPct = leads.length ? Math.round((submittedEodr.size / leads.length) * 100) : 0;

  const mondays = mondaysInMonth(monthCursor.year, monthCursor.month);

  return (
    <div>
      <div className="card home-section">
        <p className="home-section-title">EODr compliance</p>
        <div className="field" style={{ maxWidth: 220 }}><label>Date</label><input type="date" value={eodrDate} onChange={(e) => setEodrDate(e.target.value)} /></div>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 8px' }}>{submittedEodr.size} / {leads.length} submitted</p>
        <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${eodrPct}%`, background: 'var(--brand-green)' }} />
        </div>
        {eodrPending.length > 0 && (
          <div><p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)', marginBottom: 4 }}>Pending</p>
            {eodrPending.map((l) => <p key={l.id} className="home-line">{l.name}</p>)}
          </div>
        )}
      </div>

      <div className="card home-section" style={{ marginTop: 16 }}>
        <p className="home-section-title">EOWr compliance</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button className="ghost" onClick={() => setMonthCursor((c) => c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 })}>←</button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{monthLabel(monthCursor.year, monthCursor.month)}</span>
          <button className="ghost" onClick={() => setMonthCursor((c) => c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 })}>→</button>
        </div>
        {mondays.map((w) => {
          const submitted = new Set(eowrEntries.filter((e) => e.weekStart === w).map((e) => e.tl.toLowerCase().trim()));
          const pending = leads.filter((l) => !submitted.has(l.name.toLowerCase().trim()));
          const isOpen = expandedWeek === w;
          return (
            <div key={w} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedWeek(isOpen ? null : w)}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{formatWeekLabel(w)}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{submitted.size} / {leads.length}</span>
              </div>
              {isOpen && (
                <div style={{ marginTop: 8 }}>
                  {leads.map((l) => (
                    <div className="hist-row" key={l.id}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {submitted.has(l.name.toLowerCase().trim()) ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#69C920" strokeWidth="3"><path d="M4 12l6 6L20 6" /></svg>
                        ) : (
                          <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #c2c7d6', display: 'inline-block' }} />
                        )}
                        <span className="who" style={{ flex: 'none' }}>{l.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
