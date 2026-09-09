import { useState } from 'react';

function AddLinkForm({ onAddLink, showSuccessModal }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim() || !url.trim()) {
      setError('Name and link are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await onAddLink({ name: name.trim(), url: url.trim(), description: description.trim() });
    if (res.ok) {
      setName('');
      setUrl('');
      setDescription('');
      setShowForm(false);
      showSuccessModal('Link added!');
    } else {
      setError("Couldn't reach the sheet — check the webhook URL and try again.");
    }
    setSubmitting(false);
  }

  if (!showForm) {
    return (
      <button className="ghost" onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
        + Add Link
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 16, padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Link name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, minWidth: 140 }}
        />
        <input
          type="text"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>
      <input
        type="text"
        placeholder="Short description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Link'}
        </button>
        <button className="ghost" onClick={() => setShowForm(false)} disabled={submitting}>
          Cancel
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

export default function ClusterLinksTab({ links, isAdmin, onAddLink, showSuccessModal }) {
  const [query, setQuery] = useState('');

  const filtered = links.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return l.name.toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q);
  });

  return (
    <div>
      {isAdmin && <AddLinkForm onAddLink={onAddLink} showSuccessModal={showSuccessModal} />}

      <div className="field" style={{ maxWidth: 360 }}>
        <input
          type="text"
          placeholder="Search links…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="card home-section">
        {filtered.length === 0 ? (
          <p className="empty-note">{links.length === 0 ? 'No links added yet.' : 'No links match your search.'}</p>
        ) : (
          filtered.map((l, i) => (
            <div className="hist-row" key={i}>
              <span className="who">
                <a href={l.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                  {l.name}
                </a>
                {l.description && (
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)' }}>{l.description}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
