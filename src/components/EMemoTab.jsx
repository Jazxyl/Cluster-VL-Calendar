import { useState } from 'react';
import { todayPST, formatUSDate } from '../lib/dates.js';
import { toEmbedUrl } from '../lib/embeds.js';

function AddMemoForm({ onAddMemo, showSuccessModal }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [datePosted, setDatePosted] = useState(todayPST());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!title.trim() || !link.trim() || !datePosted) {
      setError('Fill in every field first.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await onAddMemo({ title: title.trim(), link: link.trim(), datePosted });
    if (res.ok) {
      setTitle('');
      setLink('');
      setDatePosted(todayPST());
      setShowForm(false);
      showSuccessModal('Memo added!');
    } else {
      setError("Couldn't reach the sheet — check the webhook URL and try again.");
    }
    setSubmitting(false);
  }

  if (!showForm) {
    return (
      <button className="ghost" onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
        + Add Memo
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 16, padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Memo title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <input
          type="text"
          placeholder="Google Doc or Drive link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <input type="date" value={datePosted} onChange={(e) => setDatePosted(e.target.value)} style={{ width: 150 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Memo'}
        </button>
        <button className="ghost" onClick={() => setShowForm(false)} disabled={submitting}>
          Cancel
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

function MemoCard({ memo, confirmedByMe, isAdmin, leads, confirmationsForMemo, onConfirm }) {
  const [expanded, setExpanded] = useState(!confirmedByMe);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    setConfirming(true);
    onConfirm({ memoTitle: memo.title });
    // The row disappears from "needs confirming" the moment local state
    // updates in the parent, so no need to reset confirming state here.
  }

  const confirmedTLs = leads.filter((l) =>
    confirmationsForMemo.some((c) => c.tl.toLowerCase().trim() === l.name.toLowerCase().trim())
  );
  const unconfirmedTLs = leads.filter((l) => !confirmedTLs.includes(l));

  return (
    <div className="card home-section" style={{ marginBottom: 14 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <p className="home-section-title" style={{ margin: 0 }}>
          {memo.title}
          {memo.datePosted && (
            <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-soft)', marginLeft: 8 }}>
              {formatUSDate(memo.datePosted)}
            </span>
          )}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {confirmedByMe && (
            <span style={{ fontSize: 11, color: 'var(--brand-green)', fontWeight: 600 }}>✓ Confirmed</span>
          )}
          {isAdmin && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowBreakdown((b) => !b);
              }}
              style={{ fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {confirmedTLs.length}/{leads.length} confirmed
            </span>
          )}
        </div>
      </div>

      {isAdmin && showBreakdown && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Confirmed:</strong> {confirmedTLs.map((l) => l.name).join(', ') || 'Nobody yet'}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Not yet:</strong> {unconfirmedTLs.map((l) => l.name).join(', ') || 'Everyone!'}
          </p>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '75%',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid var(--line)',
            }}
          >
            <iframe
              src={toEmbedUrl(memo.link)}
              title={memo.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>
          {!confirmedByMe && (
            <button className="primary" onClick={handleConfirm} disabled={confirming} style={{ marginTop: 10 }}>
              {confirming ? 'Confirming…' : 'Confirm'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function EMemoTab({ memos, memoConfirmations, leads, isAdmin, currentUserName, onAddMemo, onConfirm, showSuccessModal }) {
  const sorted = [...memos].sort((a, b) => (b.datePosted || '').localeCompare(a.datePosted || ''));

  return (
    <div>
      {isAdmin && <AddMemoForm onAddMemo={onAddMemo} showSuccessModal={showSuccessModal} />}

      {sorted.length === 0 ? (
        <div className="card home-section">
          <p className="empty-note">No memos posted yet.</p>
        </div>
      ) : (
        sorted.map((memo, i) => {
          const confirmationsForMemo = memoConfirmations.filter((c) => c.memoTitle === memo.title);
          const confirmedByMe = confirmationsForMemo.some(
            (c) => c.tl.toLowerCase().trim() === (currentUserName || '').toLowerCase().trim()
          );
          return (
            <MemoCard
              key={i}
              memo={memo}
              confirmedByMe={confirmedByMe}
              isAdmin={isAdmin}
              leads={leads}
              confirmationsForMemo={confirmationsForMemo}
              onConfirm={onConfirm}
            />
          );
        })
      )}
    </div>
  );
}
