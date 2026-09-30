import { useState, useMemo, useEffect } from 'react';

const COACHING_TYPES = ['KPI Coaching', 'Behavior', 'Attendance'];

export default function CoachingComplianceSubmitTab({ leads, agents, currentUserName, onSubmit, showSuccessModal }) {
  const [tlName, setTlName] = useState(currentUserName || leads?.[0]?.name || '');
  const [agent, setAgent] = useState('');
  const [useRoster, setUseRoster] = useState(true);
  const [type, setType] = useState('KPI Coaching');
  const [fathomLink, setFathomLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // The TL's roster, scoped to whichever TL is currently selected above —
  // not just the logged-in user, since an admin can log coaching for any TL.
  const rosterForTL = useMemo(() => {
    const raw = (agents || []).filter(
      (a) => (a.tl || '').toLowerCase().trim() === (tlName || '').toLowerCase().trim()
    );
    return Array.from(new Map(raw.map((a) => [a.name.toLowerCase().trim(), a])).values());
  }, [agents, tlName]);

  // Switching TL invalidates whatever agent was picked from the old roster.
  useEffect(() => {
    setAgent('');
  }, [tlName]);

  async function handleSubmit() {
    if (!tlName || !agent.trim() || !fathomLink.trim()) {
      setResult({ ok: false, message: 'Fill in every field first.' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const res = await onSubmit({ tl: tlName, agent: agent.trim(), type, fathomLink: fathomLink.trim() });
    if (res.ok) {
      showSuccessModal('Coaching session logged!');
      setAgent('');
      setType('KPI Coaching');
      setFathomLink('');
    } else {
      setResult({ ok: false, message: "Couldn't reach the sheet — check the webhook URL and try again." });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="panel-title">Coaching Compliance</h3>

      <div className="field">
        <label>TL name</label>
        {!leads || leads.length === 0 ? (
          <select disabled>
            <option>Add a team lead in the Calendar tab first</option>
          </select>
        ) : (
          <select value={tlName} onChange={(e) => setTlName(e.target.value)}>
            {leads.map((l) => (
              <option key={l.id} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="field">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>Agent name</span>
          {rosterForTL.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setUseRoster((v) => !v);
                setAgent('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-soft)',
                fontSize: 11,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {useRoster ? 'Type name instead' : 'Pick from roster instead'}
            </button>
          )}
        </label>
        {useRoster && rosterForTL.length > 0 ? (
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="">Select an agent</option>
            {rosterForTL.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        ) : (
          <input type="text" placeholder="Which agent" value={agent} onChange={(e) => setAgent(e.target.value)} />
        )}
      </div>

      <div className="field">
        <label>Type of coaching</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {COACHING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Fathom Recording link</label>
        <input
          type="text"
          placeholder="https://..."
          value={fathomLink}
          onChange={(e) => setFathomLink(e.target.value)}
        />
      </div>

      <button className="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit'}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className={`result-box ${result.ok ? 'result-approved' : 'result-rejected'}`}>
            {result.ok ? null : <strong>Couldn't submit</strong>}
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}
