import { useMemo, useState } from 'react';
import { fmt, todayPST, todayPSTDateObj } from '../lib/dates.js';

function isWeekend(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow === 0 || dow === 6;
}

function entriesForDate(entries, dateStr) {
  if (isWeekend(dateStr)) return [];
  return entries.filter((e) => dateStr >= e.start && dateStr <= e.end);
}

export default function CalendarTab({ leads, entries }) {
  const [cursor, setCursor] = useState(() => {
    const d = todayPSTDateObj();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const out = [];
    for (let i = firstDow - 1; i >= 0; i--) {
      out.push({ num: daysInPrev - i, out: true, dateObj: new Date(year, month - 1, daysInPrev - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ num: d, out: false, dateObj: new Date(year, month, d) });
    }
    const rem = 42 - out.length;
    for (let d = 1; d <= rem; d++) {
      out.push({ num: d, out: true, dateObj: new Date(year, month + 1, d) });
    }
    return out;
  }, [cursor]);

  const todayStr = todayPST();

  return (
    <div className="layout layout-sidebar">
      <div className="card legend">
        <h3>Team leads</h3>
        {leads.length === 0 ? (
          <p className="empty-note">No team leads yet.</p>
        ) : (
          leads.map((l) => (
            <div className="lead-row" key={l.id}>
              <span className="swatch" style={{ background: l.color }} />
              <span className="name">{l.name}</span>
            </div>
          ))
        )}
      </div>

      <div className="main-col">
        <div className="card">
          <div className="cal-head">
            <div className="month">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <div className="navbtns">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</button>
              <button
                onClick={() => {
                  const d = todayPSTDateObj();
                  d.setDate(1);
                  setCursor(d);
                }}
              >
                Today
              </button>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</button>
            </div>
          </div>
          <div className="grid7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div className="dow" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid7">
            {cells.map((c, i) => {
              const dateStr = fmt(c.dateObj);
              const dayEntries = entriesForDate(entries, dateStr);
              const pct = leads.length ? Math.min(dayEntries.length / leads.length, 1) : 0;
              const fillColor =
                pct === 0 ? 'transparent' : pct < 0.34 ? 'var(--mint)' : pct < 0.67 ? 'var(--brand-green)' : 'var(--ink-black)';
              return (
                <div
                  key={i}
                  className={`day ${c.out ? 'out' : ''} ${dateStr === todayStr ? 'today' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className="num">{c.num}</div>
                  <div className="coverage">
                    <div className="coverage-fill" style={{ width: `${pct * 100}%`, background: fillColor }} />
                  </div>
                  <div className="dots">
                    {dayEntries.slice(0, 8).map((e, idx) => {
                      const lead = leads.find((l) => l.name === e.leadName);
                      return lead ? (
                        <span key={idx} className="dot" style={{ background: lead.color }} title={lead.name} />
                      ) : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card day-detail" style={{ marginTop: 20 }}>
          {!selectedDate ? (
            <p className="empty-note">Click a date to see who's on VL.</p>
          ) : (
            <DayDetail date={selectedDate} dayEntries={entriesForDate(entries, selectedDate)} leads={leads} />
          )}
        </div>
      </div>
    </div>
  );
}

function DayDetail({ date, dayEntries, leads }) {
  const dObj = new Date(date + 'T00:00:00');
  const label = dObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div>
      <div className="date-label">{label.toUpperCase()}</div>
      {dayEntries.length === 0 ? (
        <p className="empty-note">Full cluster coverage.</p>
      ) : (
        dayEntries.map((e, i) => {
          const lead = leads.find((l) => l.name === e.leadName);
          return (
            <div className="entry-chip" key={i}>
              <span className="swatch" style={{ background: lead ? lead.color : '#ccc' }} />
              <span>
                {e.leadName}
                {e.reason ? ` — ${e.reason}` : ''}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
