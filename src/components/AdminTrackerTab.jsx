import { useState } from 'react';
import { todayPST, mondaysInMonth, monthLabel, formatWeekLabel } from '../lib/dates.js';

function EodrCompliance({ leads, eodEntries }) {
  const [selectedDate, setSelectedDate] = useState(todayPST());

  const submittedNames = new Set(
    eodEntries.filter((e) => e.date === selectedDate).map((e) => e.lead.toLowerCase().trim())
  );
  const pending = leads.filter((l) => !submittedNames.has(l.name.toLowerCase().trim()));
  const submittedCount = leads.length - pending.length;
  const pct = leads.length ? Math.round((submittedCount / leads.length) * 100) : 0;
  const barColor = pct >= 90 ? '#69C920' : pct >= 60 ? '#173143' : '#000000';

  return (
    <div className="card home-section">
      <p className="home-section-title">EODr compliance</p>
      <div className="field" style={{ maxWidth: 220 }}>
        <label>Date</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
          {submittedCount} / {leads.length} submitted
        </span>
        <span style={{ color: 'var(--ink-soft)' }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: '#e2e5ee', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor }} />
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', margin: '0 0 6px' }}>
        Pending ({pending.length})
      </p>
      {pending.length === 0 ? (
        <p className="empty-note">Everyone's submitted.</p>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
          {pending.map((l) => l.name).join(', ')}
        </p>
      )}
    </div>
  );
}

function EowrCompliance({ leads, eowrEntries }) {
  const today = todayPST();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [expanded, setExpanded] = useState(() => new Set());

  function toggle(week) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  function goPrevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function goNextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const weeks = mondaysInMonth(year, month);

  return (
    <div className="card home-section">
      <p className="home-section-title">EOWr compliance</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button className="ghost" onClick={goPrevMonth} style={{ padding: '4px 10px' }}>
          ←
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{monthLabel(year, month)}</span>
        <button className="ghost" onClick={goNextMonth} style={{ padding: '4px 10px' }}>
          →
        </button>
      </div>

      {weeks.length === 0 ? (
        <p className="empty-note">No weeks this month.</p>
      ) : (
        weeks.map((w) => {
          const submitted = leads.filter((l) =>
            eowrEntries.some(
              (e) => e.weekStart === w && e.tl.toLowerCase().trim() === l.name.toLowerCase().trim()
            )
          );
          const isOpen = expanded.has(w);
          return (
            <div key={w}>
              <div
                onClick={() => toggle(w)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '0.5px solid var(--line)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--ink)' }}>{formatWeekLabel(w)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {submitted.length}/{leads.length}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      transition: 'transform 0.15s',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      fontSize: 12,
                      color: 'var(--ink-soft)',
                    }}
                  >
                    ›
                  </span>
                </span>
              </div>
              {isOpen && (
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', padding: '8px 0 8px 12px', margin: 0 }}>
                  {submitted.length === 0
                    ? 'Nobody yet.'
                    : `Submitted: ${submitted.map((l) => l.name).join(', ')}`}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function AdminTrackerTab({ leads, eodEntries, eowrEntries }) {
  return (
    <div>
      <EodrCompliance leads={leads} eodEntries={eodEntries} />
      <div style={{ marginTop: 16 }}>
        <EowrCompliance leads={leads} eowrEntries={eowrEntries} />
      </div>
    </div>
  );
}
