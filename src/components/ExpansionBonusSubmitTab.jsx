import { useState } from 'react';
import { todayPST } from '../lib/dates.js';

export default function ExpansionBonusSubmitTab({ leads, currentUserName, onSubmit }) {
  const [tlName, setTlName] = useState(currentUserName || leads?.[0]?.name || '');
  const [agent, setAgent] = useState('');
  const [client, setClient] = useState('');
  const [startDate, setStartDate] = useState(todayPST());
  const [hubspotLink, setHubspotLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit() {
    if (!tlName || !agent.trim() || !client.trim() || !startDate || !hubspotLink.trim()) {
      setResult({ ok: false, message: 'Fill in every field first.' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const timestamp = new Date().toISOString();
    const res = await onSubmit({
      timestamp,
      tl: tlName,
      agent: agent.trim(),
      client: client.trim(),
      startDate,
      hubspotLink: hubspotLink.trim(),
    });
    if (res.ok) {
      setResult({ ok: true, message: '✅ Submitted!' });
      setAgent('');
      setClient('');
      setHubspotLink('');
      setStartDate(todayPST());
    } else {
      setResult({ ok: false, message: "Couldn't reach the sheet — check the webhook URL and try again." });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="panel-title">Expansion Bonus</h3>

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
        <label>Client name</label>
        <input type="text" placeholder="Which client" value={client} onChange={(e) => setClient(e.target.value)} />
      </div>

      <div className="field">
        <label>Start date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>

      <div className="field">
        <label>Hubspot link</label>
        <input
          type="text"
          placeholder="https://..."
          value={hubspotLink}
          onChange={(e) => setHubspotLink(e.target.value)}
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
