import { useState } from 'react';
import { todayPST, isExpansionBonusMature, formatUSDate } from '../lib/dates.js';

function findCompletion(completions, timestamp) {
  return completions.find((c) => c.originalTimestamp === timestamp);
}

function ProcessRow({ entry, onProcess }) {
  const [checked, setChecked] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleCheck(e) {
    setChecked(e.target.checked);
    if (!e.target.checked) setNotes('');
  }

  function handleSubmit() {
    if (!notes.trim()) return;
    setSubmitting(true);
    onProcess({ originalTimestamp: entry.timestamp, notes: notes.trim() });
  }

  return (
    <div style={{ padding: '8px 0', borderBottom: '0.5px solid var(--line)' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}>
        <input type="checkbox" checked={checked} onChange={handleCheck} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {entry.agent} <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>· {entry.client}</span>
        </span>
      </label>
      <p style={{ margin: '0 0 4px 26px', fontSize: 11, color: 'var(--ink-soft)' }}>
        {entry.tl} · started {formatUSDate(entry.startDate)}
      </p>
      {checked && (
        <div style={{ display: 'flex', gap: 6, margin: '6px 0 0 26px' }}>
          <input
            type="text"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          />
          <button className="primary" onClick={handleSubmit} disabled={submitting || !notes.trim()}>
            {submitting ? 'Saving…' : 'Approve'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExpansionBonusStatusTab({ entries, completions, isAdmin, currentUserName, onProcess }) {
  const todayStr = todayPST();

  const actionable = [];
  const settled = [];

  entries.forEach((e) => {
    const completion = findCompletion(completions, e.timestamp);
    if (completion) {
      settled.push({ ...e, completion });
    } else if (isExpansionBonusMature(e.startDate, todayStr)) {
      actionable.push(e);
    } else {
      settled.push({ ...e, pending: true });
    }
  });

  return (
    <div>
      {isAdmin && (
        <div className="card home-section">
          <p className="home-section-title">Needs processing ({actionable.length})</p>
          {actionable.length === 0 ? (
            <p className="empty-note">Nothing to process right now.</p>
          ) : (
            actionable.map((e) => <ProcessRow key={e.timestamp} entry={e} onProcess={onProcess} />)
          )}
        </div>
      )}

      <div className="card home-section" style={{ marginTop: isAdmin ? 16 : 0 }}>
        <p className="home-section-title">All submissions</p>
        {entries.length === 0 ? (
          <p className="empty-note">Nothing submitted yet.</p>
        ) : (
          [...settled, ...(isAdmin ? [] : actionable)]
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            .map((e, i) => {
              const completion = findCompletion(completions, e.timestamp);
              return (
                <div className="hist-row" key={i}>
                  <span className={`badge ${completion ? 'approved' : 'rejected'}`}>
                    {completion ? 'Approved' : 'Pending'}
                  </span>
                  <span className="who">
                    {e.agent} · {e.client}
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-soft)' }}>
                      {e.tl} · started {formatUSDate(e.startDate)}
                      {completion ? ` · ${completion.processedBy}: ${completion.notes}` : ''}
                    </span>
                  </span>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
