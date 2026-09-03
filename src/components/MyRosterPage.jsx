import { useState } from 'react';
import { formatUSDate, todayPST } from '../lib/dates.js';

function AddAgentForm({ onAddAgent }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [hubstaffId, setHubstaffId] = useState('');
  const [date, setDate] = useState(todayPST());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim() || !hubstaffId.trim() || !date) {
      setError('Fill in every field first.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await onAddAgent({ name: name.trim(), hubstaffId: hubstaffId.trim(), date });
    if (res.ok) {
      setName('');
      setHubstaffId('');
      setDate(todayPST());
      setShowForm(false);
    } else {
      setError("Couldn't reach the sheet — check the webhook URL and try again.");
    }
    setSubmitting(false);
  }

  if (!showForm) {
    return (
      <button className="ghost" onClick={() => setShowForm(true)} style={{ marginBottom: 12 }}>
        + Add agent
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 16, padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, minWidth: 140 }}
        />
        <input
          type="text"
          placeholder="Hubstaff ID"
          value={hubstaffId}
          onChange={(e) => setHubstaffId(e.target.value)}
          style={{ width: 130 }}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 150 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add agent'}
        </button>
        <button className="ghost" onClick={() => setShowForm(false)} disabled={submitting}>
          Cancel
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

function AgentRow({ agent, onRemoveAgent }) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleConfirmRemove() {
    setRemoving(true);
    await onRemoveAgent({ name: agent.name, tl: agent.tl, hubstaffId: agent.hubstaffId });
    // No need to reset state on success — the row disappears once the
    // parent's list updates. Only reset if something goes visibly wrong.
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>{agent.name}</span>
      <span style={{ width: 110, fontSize: 12, color: 'var(--ink-soft)' }}>{agent.hubstaffId || '—'}</span>
      <span style={{ width: 90, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-soft)', textAlign: 'right' }}>
        {agent.date ? formatUSDate(agent.date) : '—'}
      </span>
      <span style={{ width: confirming ? 140 : 70, textAlign: 'right' }}>
        {confirming ? (
          <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            <button className="ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setConfirming(false)} disabled={removing}>
              Cancel
            </button>
            <button
              className="ghost"
              style={{ padding: '4px 8px', fontSize: 11, color: '#c0392b' }}
              onClick={handleConfirmRemove}
              disabled={removing}
            >
              {removing ? '…' : 'Confirm'}
            </button>
          </span>
        ) : (
          <button className="ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setConfirming(true)}>
            Remove
          </button>
        )}
      </span>
    </div>
  );
}

export default function MyRosterPage({ agents, onAddAgent, onRemoveAgent }) {
  return (
    <div className="card home-section">
      <p className="home-section-title">Your agents ({agents.length})</p>

      <AddAgentForm onAddAgent={onAddAgent} />

      {agents.length === 0 ? (
        <p className="empty-note">No agents assigned to you yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, padding: '4px 0 8px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ flex: 1, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)' }}>
              Name
            </span>
            <span style={{ width: 110, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)' }}>
              Hubstaff ID
            </span>
            <span style={{ width: 90, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)', textAlign: 'right' }}>
              Start date
            </span>
            <span style={{ width: 70 }} />
          </div>
          {agents.map((a, i) => (
            <AgentRow key={i} agent={a} onRemoveAgent={onRemoveAgent} />
          ))}
        </>
      )}
    </div>
  );
}
