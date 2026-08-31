import { useState } from 'react';
import { todayPST, isNominationWindowOpen, currentMonthKey } from '../lib/dates.js';

export default function NominationSubmitTab({ leads, currentUserName, nominations, onSubmit }) {
  const todayStr = todayPST();
  const windowOpen = isNominationWindowOpen(todayStr);
  const thisMonth = currentMonthKey(todayStr);

  const [tlName, setTlName] = useState(currentUserName || leads?.[0]?.name || '');
  const [agent, setAgent] = useState('');
  const [client, setClient] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!windowOpen) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <h3 className="panel-title">Town Hall Nomination</h3>
        <p className="empty-note">
          You've missed this month's submission window. Nominations are open from the 1st through the 16th
          of each month — this reopens next month.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!tlName || !agent.trim() || !client.trim() || !reason.trim()) {
      setResult({ ok: false, message: 'Fill in every field first.' });
      return;
    }
    const alreadySubmitted = nominations.some(
      (n) => n.tl.toLowerCase().trim() === tlName.toLowerCase().trim() && n.month === thisMonth
    );
    if (alreadySubmitted) {
      setResult({ ok: false, message: `${tlName} has already submitted a nomination for this month.` });
      return;
    }

    setSubmitting(true);
    setResult(null);
    const res = await onSubmit({ tl: tlName, agent: agent.trim(), client: client.trim(), reason: reason.trim(), month: thisMonth });
    if (res.ok) {
      setResult({ ok: true, message: '✅ Nomination submitted!' });
      setAgent('');
      setClient('');
      setReason('');
    } else {
      setResult({ ok: false, message: "Couldn't reach the sheet — check the webhook URL and try again." });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="panel-title">Town Hall Nomination</h3>

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
        <input type="text" placeholder="Who are you nominating?" value={agent} onChange={(e) => setAgent(e.target.value)} />
      </div>

      <div className="field">
        <label>Client name</label>
        <input type="text" placeholder="Which client account" value={client} onChange={(e) => setClient(e.target.value)} />
      </div>

      <div className="field">
        <label>Reason</label>
        <textarea
          rows={4}
          placeholder="Why are you nominating them?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      <button className="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Nomination'}
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
