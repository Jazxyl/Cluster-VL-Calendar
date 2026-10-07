import { currentMonthKey, monthKeyLabel } from '../lib/dates.js';

// Sheet timestamps come through the CSV export as "M/D/YYYY H:mm:ss" (or ISO,
// depending on the sheet's locale), so parse both explicitly instead of
// trusting string order. Returns null when it can't be read.
function parseEntryDate(raw) {
  const s = (raw || '').trim();
  if (!s) return null;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (us) {
    const [, m, d, y, hh = 0, mm = 0, ss = 0] = us;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKeyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function Rows({ items, isAdmin }) {
  return items.map(({ entry: e, month }, i) => (
    <div className="hist-row" key={i}>
      <span style={{ fontSize: 11, color: 'var(--ink-soft)', minWidth: 96 }}>{month}</span>
      <span className="badge approved">{e.type}</span>
      <span className="who">
        {e.agent}
        {isAdmin ? <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-soft)' }}>{e.tl}</span> : null}
      </span>
      <a href={e.fathomLink} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>
        Recording
      </a>
    </div>
  ));
}

// Newest first. Entries with no readable date sort to the top (they are the
// ones just submitted this session, before the sheet is re-read).
function newestFirst(a, b) {
  return (b.date ? b.date.getTime() : Infinity) - (a.date ? a.date.getTime() : Infinity);
}

export default function CoachingComplianceStatusTab({ entries, isAdmin, currentUserName }) {
  const thisMonth = currentMonthKey();

  const mine = isAdmin
    ? entries
    : entries.filter((e) => (e.tl || '').toLowerCase().trim() === (currentUserName || '').toLowerCase().trim());

  const current = [];
  const previous = [];
  mine.forEach((entry) => {
    const date = parseEntryDate(entry.timestamp);
    if (!date) {
      // No timestamp means it was just submitted this session; one that can't
      // be parsed stays visible in the current box rather than vanishing.
      current.push({ entry, date, month: entry.timestamp ? '—' : monthKeyLabel(thisMonth) });
    } else if (monthKeyOf(date) === thisMonth) {
      current.push({ entry, date, month: monthKeyLabel(thisMonth) });
    } else {
      previous.push({ entry, date, month: monthKeyLabel(monthKeyOf(date)) });
    }
  });
  current.sort(newestFirst);
  previous.sort(newestFirst);

  return (
    <div>
      <div className="card home-section">
        <p className="home-section-title">
          {isAdmin ? 'All coaching sessions' : 'Your coaching sessions'} · {monthKeyLabel(thisMonth)}
        </p>
        {current.length === 0 ? (
          <p className="empty-note">Nothing logged this month yet.</p>
        ) : (
          <Rows items={current} isAdmin={isAdmin} />
        )}
      </div>

      <div className="card home-section" style={{ marginTop: 16 }}>
        <p className="home-section-title">Previous months coaching compliance</p>
        {previous.length === 0 ? (
          <p className="empty-note">Nothing from previous months.</p>
        ) : (
          <Rows items={previous} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
