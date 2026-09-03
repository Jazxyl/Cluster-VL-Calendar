import { useState } from 'react';

const COACHING_TYPES = ['KPI Coaching', 'Behavior', 'Attendance'];

export default function CoachingComplianceSubmitTab({ leads, currentUserName, onSubmit, showSuccessModal }) {
  const [tlName, setTlName] = useState(currentUserName || leads?.[0]?.name || '');
  const [agent, setAgent] = useState('');
  const [type, setType] = useState('KPI Coaching');
  const [fathomLink, setFathomLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
        <label>Agent name</label>
        <input type="text" placeholder="Which agent" value={agent} onChange={(e) => setAgent(e.target.value)} />
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
