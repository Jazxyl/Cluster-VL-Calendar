import { useState } from 'react';
import { formatUSDate, todayPST } from '../lib/dates.js';

function AddAgentForm({ onAddAgent, onDone }) {
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
      onDone();
    } else {
      setError("Couldn't reach the sheet — check the webhook URL and try again.");
    }
    setSubmitting(false);
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
        <button className="ghost" onClick={onDone} disabled={submitting}>
          Cancel
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

function AgentRow({ agent, onRemoveAgent, onEditAgent }) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(agent.name);
  const [editHubstaffId, setEditHubstaffId] = useState(agent.hubstaffId || '');
  const [editDate, setEditDate] = useState(agent.date || todayPST());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmRemove() {
    setRemoving(true);
    await onRemoveAgent({ name: agent.name, tl: agent.tl, hubstaffId: agent.hubstaffId });
  }

  function startEdit() {
    setEditName(agent.name);
    setEditHubstaffId(agent.hubstaffId || '');
    setEditDate(agent.date || todayPST());
    setError('');
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!editName.trim() || !editHubstaffId.trim() || !editDate) {
      setError('Fill in every field first.');
      return;
    }
    setError('');
    setSaving(true);
    const res = await onEditAgent({
      originalName: agent.name,
      tl: agent.tl,
      originalHubstaffId: agent.hubstaffId,
      newName: editName.trim(),
      newHubstaffId: editHubstaffId.trim(),
      newDate: editDate,
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
      <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Agent name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ flex: 1, minWidth: 140 }}
          />
          <input
            type="text"
            placeholder="Hubstaff ID"
            value={editHubstaffId}
            onChange={(e) => setEditHubstaffId(e.target.value)}
            style={{ width: 130 }}
          />
          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: 150 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={handleSaveEdit} disabled={saving}>
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
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>{agent.name}</span>
      <span style={{ width: 110, fontSize: 12, color: 'var(--ink-soft)' }}>{agent.hubstaffId || '—'}</span>
      <span style={{ width: 90, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-soft)', textAlign: 'right' }}>
        {agent.date ? formatUSDate(agent.date) : '—'}
      </span>
      <span style={{ width: confirming ? 140 : 120, textAlign: 'right' }}>
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
          <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            <button className="ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={startEdit}>
              Edit
            </button>
            <button className="ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setConfirming(true)}>
              Remove
            </button>
          </span>
        )}
      </span>
    </div>
  );
}

export default function MyRosterPage({ agents, onAddAgent, onRemoveAgent, onEditAgent }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="card home-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddForm ? 12 : 0 }}>
        <p className="home-section-title" style={{ margin: 0 }}>
          Your agents ({agents.length})
        </p>
        {!showAddForm && (
          <button className="ghost" onClick={() => setShowAddForm(true)}>
            + Add agent
          </button>
        )}
      </div>

      {showAddForm && <AddAgentForm onAddAgent={onAddAgent} onDone={() => setShowAddForm(false)} />}

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
            <span style={{ width: 120 }} />
          </div>
          {agents.map((a, i) => (
            <AgentRow key={i} agent={a} onRemoveAgent={onRemoveAgent} onEditAgent={onEditAgent} />
          ))}
        </>
      )}
    </div>
  );
}
