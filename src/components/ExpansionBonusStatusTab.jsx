import { useState } from 'react';
import { todayPST, isExpansionBonusMature, formatUSDate, isCompletionDeclined } from '../lib/dates.js';

function findCompletion(completions, timestamp) {
  return completions.find((c) => c.originalTimestamp === timestamp);
}

// PaidAt comes back from the sheet as "M/D/YYYY H:mm:ss", or as "YYYY-MM-DD"
// when it was just marked in this session and the sheet hasn't been re-read.
function paidDateLabel(paidAt) {
  const s = (paidAt || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return formatUSDate(s.slice(0, 10));
  return s.split(' ')[0];
}

function sameName(a, b) {
  return (a || '').toLowerCase().trim() === (b || '').toLowerCase().trim();
}

function ProcessRow({ entry, onProcess }) {
  const [checked, setChecked] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleCheck(e) {
    setChecked(e.target.checked);
    if (!e.target.checked) setNotes('');
  }

  function handleSubmit(status) {
    if (!notes.trim()) return;
    setSubmitting(true);
    onProcess({ originalTimestamp: entry.timestamp, notes: notes.trim(), status });
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
          <button className="primary" onClick={() => handleSubmit('Approved')} disabled={submitting || !notes.trim()}>
            {submitting ? 'Saving…' : 'Approve'}
          </button>
          <button onClick={() => handleSubmit('Denied')} disabled={submitting || !notes.trim()}>
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExpansionBonusStatusTab({
  entries,
  completions,
  isAdmin,
  currentUserName,
  onProcess,
  onMarkPaid,
  onUndoPaid,
}) {
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

  // Approved but not yet confirmed as paid out. Every approved entry starts
  // here, including ones approved before payment tracking existed.
  const awaitingPayment = settled.filter(
    (e) => e.completion && !isCompletionDeclined(e.completion) && !e.completion.paidAt
  );

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

      {isAdmin && (
        <div className="card home-section" style={{ marginTop: 16 }}>
          <p className="home-section-title">Awaiting payment ({awaitingPayment.length})</p>
          {awaitingPayment.length === 0 ? (
            <p className="empty-note">Everything approved has been paid out.</p>
          ) : (
            awaitingPayment.map((e) => (
              <div className="hist-row" key={e.timestamp}>
                <span className="who">
                  {e.agent} · {e.client}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-soft)' }}>
                    {e.tl} · approved by {e.completion.processedBy}
                  </span>
                </span>
                <button onClick={() => onMarkPaid({ originalTimestamp: e.timestamp })}>Mark as paid</button>
              </div>
            ))
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
              const declined = completion && isCompletionDeclined(completion);
              const paid = completion && !declined && !!completion.paidAt;
              const awaiting = completion && !declined && !completion.paidAt;
              const canMarkPaid = awaiting && (isAdmin || sameName(e.tl, currentUserName));

              let badgeClass = 'rejected';
              let badgeText = 'Pending';
              if (declined) badgeText = 'Declined';
              else if (paid) {
                badgeClass = 'approved';
                badgeText = 'Paid';
              } else if (awaiting) {
                badgeClass = 'awaiting';
                badgeText = 'Awaiting payment';
              }

              return (
                <div className="hist-row" key={i}>
                  <span className={`badge ${badgeClass}`}>{badgeText}</span>
                  <span className="who">
                    {e.agent} · {e.client}
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-soft)' }}>
                      {e.tl} · started {formatUSDate(e.startDate)}
                      {completion ? ` · ${completion.processedBy}: ${completion.notes}` : ''}
                      {paid
                        ? ` · paid${paidDateLabel(completion.paidAt) ? ` ${paidDateLabel(completion.paidAt)}` : ''}${
                            completion.paidBy ? ` (confirmed by ${completion.paidBy})` : ''
                          }`
                        : ''}
                    </span>
                  </span>
                  {canMarkPaid && (
                    <button onClick={() => onMarkPaid({ originalTimestamp: e.timestamp })}>Mark as paid</button>
                  )}
                  {paid && isAdmin && (
                    <button
                      type="button"
                      onClick={() => onUndoPaid({ originalTimestamp: e.timestamp })}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                    >
                      Undo
                    </button>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
