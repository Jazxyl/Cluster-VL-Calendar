import { useState } from 'react';
import { todayPST } from '../lib/dates.js';

export default function FileVLTab({ leads, filings, onSubmit, currentUserName }) {
  const [leadName, setLeadName] = useState(currentUserName || leads[0]?.name || '');
  const [start, setStart] = useState(todayPST());
  const [end, setEnd] = useState(todayPST());
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const activeLead = leadName || currentUserName || leads[0]?.name || '';

  async function handleSubmit() {
    if (!activeLead) return;
    if (end < start) return;
    setSubmitting(true);
    const record = await onSubmit({ leadName: activeLead, start, end, reason });
    setResult(record);
    setSubmitting(false);
  }

  return (
    <div>
      <div className="file-row">
        <div className="card" style={{ padding: 20 }}>
          <h3 className="panel-title">File a VL</h3>

          <div className="field">
            <label>Team lead</label>
            {leads.length === 0 ? (
              <select disabled>
                <option>Add a team lead in the Calendar tab first</option>
              </select>
            ) : (
              <select value={activeLead} onChange={(e) => setLeadName(e.target.value)}>
                {leads.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label>Start date</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label>End date</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="field">
            <label>Reason (optional)</label>
            <input
              type="text"
              placeholder="e.g. Personal trip"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button className="primary" onClick={handleSubmit} disabled={submitting || leads.length === 0}>
            {submitting ? 'Checking…' : 'Check & file'}
          </button>

          {result && (
            <div style={{ marginTop: 16 }}>
              {result.approved ? (
                <div className="result-box result-approved">
                  <strong>Approved</strong>
                  Filed for {result.leadName}, {result.duration} business day{result.duration === 1 ? '' : 's'} (
                  {result.start} to {result.end}), with {result.noticeGiven} days' notice against a{' '}
                  {result.daysNeeded}-day ({result.weeksNeeded}-week) requirement. Added to the calendar.
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #b7e78c' }}>
                    <strong style={{ marginBottom: 4 }}>Now file it on Hubstaff:</strong>
                    <ol style={{ margin: '4px 0 10px', paddingLeft: 18 }}>
                      <li>Uncheck "All day (24hrs)"</li>
                      <li>Specify your shift start and end time</li>
                    </ol>
                    <img
                      src="/hubstaff-guide.png"
                      alt="Hubstaff date range and shift time fields"
                      style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid #b7e78c' }}
                    />
                  </div>
                </div>
              ) : result.rejectReason === 'duplicate' ? (
                <div className="result-box result-rejected">
                  <strong>Rejected — already filed for these dates</strong>
                  {result.leadName} already has an approved VL from {result.conflictStart} to {result.conflictEnd},
                  which overlaps {result.start} to {result.end}. Not added again.
                </div>
              ) : (
                <div className="result-box result-rejected">
                  <strong>Rejected — notice period not met</strong>
                  Filed for {result.leadName}, {result.duration} business day{result.duration === 1 ? '' : 's'} (
                  {result.start} to {result.end}), needs {result.weeksNeeded} weeks' ({result.daysNeeded} days)
                  notice but was filed with only {result.noticeGiven} days' notice. Not added to the calendar.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 className="panel-title" style={{ fontSize: 13 }}>
            Notice-period policy
          </h3>
          <p className="policy-row">
            <strong>1–3 business days</strong> → 3 weeks advance notice
          </p>
          <p className="policy-row">
            <strong>4–9 business days</strong> → 4 weeks advance notice
          </p>
          <p className="policy-row">
            <strong>10+ business days</strong> → 6 weeks advance notice
          </p>
          <p className="empty-note" style={{ marginTop: 10 }}>
            Approved requests are added to the calendar automatically and written to the sheet. You still need to
            file the leave on Hubstaff yourself.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, padding: 18 }}>
        <h3 className="panel-title" style={{ fontSize: 13 }}>
          Recent filings
        </h3>
        {filings.length === 0 ? (
          <p className="empty-note">No filings yet.</p>
        ) : (
          filings.slice(0, 30).map((f) => (
            <div className="hist-row" key={f.id}>
              <span className={`badge ${f.approved ? 'approved' : 'rejected'}`}>
                {f.approved ? 'Approved' : 'Rejected'}
              </span>
              <span className="who">
                {f.leadName} — {f.start} to {f.end}
                {f.reason ? ` · ${f.reason}` : ''}
              </span>
              <span className="hist-when">filed {f.filedOn}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
