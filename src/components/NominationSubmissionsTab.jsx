import { useState } from 'react';
import { monthKeyLabel } from '../lib/dates.js';

function SubmissionRow({ nomination, onEditNomination }) {
  const [editing, setEditing] = useState(false);
  const [agent, setAgent] = useState(nomination.agent);
  const [client, setClient] = useState(nomination.client);
  const [reason, setReason] = useState(nomination.reason);
  const [recordingLink, setRecordingLink] = useState(nomination.recordingLink || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startEdit() {
    setAgent(nomination.agent);
    setClient(nomination.client);
    setReason(nomination.reason);
    setRecordingLink(nomination.recordingLink || '');
    setError('');
    setEditing(true);
  }

  async function handleSave() {
    if (!agent.trim() || !client.trim() || !reason.trim()) {
      setError('Fill in every field first.');
      return;
    }
    setError('');
    setSaving(true);
    const res = await onEditNomination({
      tl: nomination.tl,
      month: nomination.month,
      agent: agent.trim(),
      client: client.trim(),
      reason: reason.trim(),
      recordingLink: recordingLink.trim(),
    });
    if (res.ok) {
      setEditing(false);
    } else {
      setError("Couldn't reach the sheet — check the webhook URL and try again.");
    }
    setSaving(false);
  }

  if (editing) {
    return (
      <div className="card home-section" style={{ marginBottom: 12 }}>
        <p className="home-section-title">{monthKeyLabel(nomination.month)}</p>
        <div className="field">
          <label>Agent name</label>
          <input type="text" value={agent} onChange={(e) => setAgent(e.target.value)} />
        </div>
        <div className="field">
          <label>Client name</label>
          <input type="text" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
        <div className="field">
          <label>Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>
        <div className="field">
          <label>Client recording link (optional)</label>
          <input type="text" value={recordingLink} onChange={(e) => setRecordingLink(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="ghost" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </button>
        </div>
        {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="card home-section" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="home-section-title" style={{ margin: '0 0 4px' }}>
            {monthKeyLabel(nomination.month)} — {nomination.agent}{' '}
            <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>· {nomination.client}</span>
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)' }}>{nomination.reason}</p>
        </div>
        <button className="ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={startEdit}>
          Edit
        </button>
      </div>
    </div>
  );
}

export default function NominationSubmissionsTab({ nominations, currentUserName, onEditNomination }) {
  const mine = nominations
    .filter((n) => n.tl.toLowerCase().trim() === (currentUserName || '').toLowerCase().trim())
    .sort((a, b) => b.month.localeCompare(a.month));

  if (mine.length === 0) {
    return (
      <div className="card home-section">
        <p className="empty-note">You haven't submitted any nominations yet.</p>
      </div>
    );
  }

  return (
    <div>
      {mine.map((n, i) => (
        <SubmissionRow key={i} nomination={n} onEditNomination={onEditNomination} />
      ))}
    </div>
  );
}
