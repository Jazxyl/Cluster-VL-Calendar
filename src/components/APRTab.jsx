import { useState } from 'react';
import { todayPST, formatUSDate, isAprRelevant, isAprOverdue, daysFromAprDue, anchoredAprOccurrence } from '../lib/dates.js';
import { fileToBase64 } from '../lib/files.js';

function completionKey(name, occurrenceDate) {
  return `${(name || '').trim().toLowerCase()}|${occurrenceDate}`;
}

function UpcomingAprRow({ apr, occurrenceDate, overdue, onCompleteApr }) {
  const [checked, setChecked] = useState(false);
  const [link, setLink] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleCheck(e) {
    setChecked(e.target.checked);
    if (!e.target.checked) {
      setLink('');
      setScreenshot(null);
      setError('');
    }
  }

  async function handleSubmit() {
    if (!link.trim() || !screenshot) return;
    setError('');
    setSubmitting(true);
    try {
      const encoded = await fileToBase64(screenshot);
      onCompleteApr({ name: apr.name, tl: apr.tl, occurrenceDate, hubspotLink: link.trim(), screenshot: encoded });
    } catch (err) {
      setError(err.message || 'Could not read that file.');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="hist-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }}>
          <input type="checkbox" checked={checked} onChange={handleCheck} />
          <span className="who" style={overdue ? { color: '#c0392b', fontWeight: 600 } : undefined}>
            {apr.name}
            {overdue ? ' — overdue' : ''}
          </span>
        </label>
        <span className="hist-when">{formatUSDate(apr.date)}</span>
      </div>
      {checked && (
        <div style={{ padding: '0 0 12px 26px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              type="text"
              placeholder="Hubspot link for this agent"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
              Hubspot screenshot
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files[0] || null)}
              style={{ flex: 1, fontSize: 12 }}
            />
            <button className="primary" onClick={handleSubmit} disabled={submitting || !link.trim() || !screenshot}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
          {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function APRTab({ aprs, isAdmin, currentUserName, aprCompletions, onCompleteApr }) {
  const todayStr = todayPST();
  const completions = aprCompletions || new Set();

  function withOccurrence(a) {
    return { ...a, occurrenceDate: anchoredAprOccurrence(a.date, todayStr) };
  }

  function notCompleted(a) {
    return !completions.has(completionKey(a.name, a.occurrenceDate));
  }

  if (isAdmin) {
    const relevant = aprs
      .filter((a) => isAprRelevant(a.date, todayStr))
      .map(withOccurrence)
      .filter(notCompleted)
      .sort((a, b) => daysFromAprDue(a.date, todayStr) - daysFromAprDue(b.date, todayStr));

    const byTl = {};
    relevant.forEach((a) => {
      const tl = a.tl || 'Unassigned';
      if (!byTl[tl]) byTl[tl] = [];
      byTl[tl].push(a);
    });
    const tlGroups = Object.entries(byTl).sort((a, b) => a[0].localeCompare(b[0]));

    return (
      <div>
        {tlGroups.length === 0 ? (
          <div className="card home-section">
            <p className="home-section-title">Upcoming APRs</p>
            <p className="empty-note">No upcoming APRs on file.</p>
          </div>
        ) : (
          tlGroups.map(([tl, agents]) => (
            <div className="card home-section" key={tl}>
              <p className="home-section-title">
                {tl} ({agents.length})
              </p>
              {agents.map((a) => (
                <UpcomingAprRow
                  key={completionKey(a.name, a.occurrenceDate)}
                  apr={a}
                  occurrenceDate={a.occurrenceDate}
                  overdue={isAprOverdue(a.date, todayStr)}
                  onCompleteApr={onCompleteApr}
                />
              ))}
            </div>
          ))
        )}
      </div>
    );
  }

  const mine = aprs.filter(
    (a) => (a.tl || '').toLowerCase().trim() === (currentUserName || '').toLowerCase().trim()
  );
  const relevant = mine
    .filter((a) => isAprRelevant(a.date, todayStr))
    .map(withOccurrence)
    .filter(notCompleted)
    .sort((a, b) => daysFromAprDue(a.date, todayStr) - daysFromAprDue(b.date, todayStr));
  const past = mine
    .filter((a) => a.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="card home-section">
        <p className="home-section-title">Upcoming APRs</p>
        {relevant.length === 0 ? (
          <p className="empty-note">No upcoming APRs for your agents.</p>
        ) : (
          relevant.map((a) => (
            <UpcomingAprRow
              key={completionKey(a.name, a.occurrenceDate)}
              apr={a}
              occurrenceDate={a.occurrenceDate}
              overdue={isAprOverdue(a.date, todayStr)}
              onCompleteApr={onCompleteApr}
            />
          ))
        )}
      </div>

      <div className="card home-section" style={{ marginTop: 16 }}>
        <p className="home-section-title">Recently passed</p>
        {past.length === 0 ? (
          <p className="empty-note">Nothing yet.</p>
        ) : (
          past.map((a, i) => (
            <div className="hist-row" key={i}>
              <span className="who">{a.name}</span>
              <span className="hist-when">{formatUSDate(a.date)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
