import { useState } from 'react';
import { recentWeekStarts, formatWeekLabel, lastWeekStart } from '../lib/dates.js';

export default function EOWrSubmitTab({ currentUserName, leads, onSubmit }) {
  const weeks = recentWeekStarts();
  const [weekStart, setWeekStart] = useState(lastWeekStart());
  const [leadName, setLeadName] = useState(currentUserName || leads[0]?.name || '');
  const [sheetLink, setSheetLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit() {
    if (!leadName || !sheetLink.trim()) {
      setResult({ ok: false, message: 'Pick a team lead and paste your Sheet link first.' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const res = await onSubmit({ tl: leadName, weekStart, sheetLink: sheetLink.trim() });
    if (res.ok) {
      setResult({ ok: true, message: '✅ EOWr submitted!' });
      setSheetLink('');
    } else {
      setResult({ ok: false, message: "Couldn't reach the sheet — check the webhook URL and try again." });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="panel-title">EOWr Submission</h3>

      <div className="field">
        <label>Team lead</label>
        {leads.length === 0 ? (
          <select disabled>
            <option>Add a team lead in the Calendar tab first</option>
          </select>
        ) : (
          <select value={leadName} onChange={(e) => setLeadName(e.target.value)}>
            {leads.map((l) => (
              <option key={l.id} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="field">
        <label>Week</label>
        <select value={weekStart} onChange={(e) => setWeekStart(e.target.value)}>
          {weeks.map((w) => (
            <option key={w} value={w}>
              {formatWeekLabel(w)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Google Sheet link</label>
        <input
          type="text"
          placeholder="https://docs.google.com/spreadsheets/..."
          value={sheetLink}
          onChange={(e) => setSheetLink(e.target.value)}
        />
      </div>

      <button className="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit EOWr'}
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
