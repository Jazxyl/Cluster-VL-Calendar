import { useState } from 'react';
import { todayPST } from '../lib/dates.js';
import { fileToBase64 } from '../lib/files.js';
import { postToSheet, eodPayload } from '../lib/webhook.js';

const EMPTY_FORM = {
  date: todayPST(),
  clientCalls: '',
  coachings: '',
  fathomLink: '',
  ticketMonitoring: '',
};

export default function EODFormTab() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hubspotFile, setHubspotFile] = useState(null);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function missingFields() {
    const missing = [];
    if (!form.date) missing.push('Date');
    if (!form.clientCalls.trim()) missing.push('Client-related calls attended');
    if (!form.coachings.trim()) missing.push('One on one coachings completed');
    if (!form.fathomLink.trim()) missing.push('TL Fathom call recording tracker link');
    if (!form.ticketMonitoring.trim()) missing.push('Ticket monitoring completed');
    if (!hubspotFile) missing.push('Hubspot tasks screenshot');
    if (!attendanceFile) missing.push('TP App attendance screenshot');
    return missing;
  }

  async function handleSubmit() {
    const missing = missingFields();
    if (missing.length > 0) {
      setResult({ ok: false, message: `Missing: ${missing.join(', ')}` });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const [hubspotEncoded, attendanceEncoded] = await Promise.all([
        fileToBase64(hubspotFile),
        fileToBase64(attendanceFile),
      ]);

      const res = await postToSheet(
        eodPayload({ ...form, hubspotFile: hubspotEncoded, attendanceFile: attendanceEncoded })
      );

      if (res.ok) {
        setResult({ ok: true, message: 'Submitted. Check the EOD sheet in a moment to confirm the screenshots landed.' });
        setForm(EMPTY_FORM);
        setHubspotFile(null);
        setAttendanceFile(null);
      } else {
        setResult({ ok: false, message: "Couldn't reach the sheet — check the webhook URL and try again." });
      }
    } catch (err) {
      setResult({ ok: false, message: err.message || 'Something went wrong reading a file.' });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 20, maxWidth: 560 }}>
      <h3 className="panel-title">EOD Form</h3>

      <div className="field">
        <label>Date</label>
        <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
      </div>

      <div className="field">
        <label>Client-related calls attended</label>
        <textarea
          rows={3}
          placeholder="Client Name + Purpose, e.g. check-in or IAR"
          value={form.clientCalls}
          onChange={(e) => update('clientCalls', e.target.value)}
          style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      <div className="field">
        <label>One on one coachings completed</label>
        <textarea
          rows={3}
          placeholder="Total (e.g. 5/25), then Agent Name + Client Name + Purpose per line"
          value={form.coachings}
          onChange={(e) => update('coachings', e.target.value)}
          style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      <div className="field">
        <label>TL Fathom call recording tracker link</label>
        <input
          type="text"
          placeholder="https://..."
          value={form.fathomLink}
          onChange={(e) => update('fathomLink', e.target.value)}
        />
      </div>

      <div className="field">
        <label>Ticket monitoring completed</label>
        <textarea
          rows={3}
          placeholder="Agent Name + Client Name : Total, e.g. 3/5"
          value={form.ticketMonitoring}
          onChange={(e) => update('ticketMonitoring', e.target.value)}
          style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      <div className="field">
        <label>Hubspot tasks completion — screenshot of remaining tasks (max 10 MB)</label>
        <input type="file" accept="image/*" onChange={(e) => setHubspotFile(e.target.files[0] || null)} />
      </div>

      <div className="field">
        <label>TP App attendance notification — screenshot (max 10 MB)</label>
        <input type="file" accept="image/*" onChange={(e) => setAttendanceFile(e.target.files[0] || null)} />
      </div>

      <button className="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit EOD'}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className={`result-box ${result.ok ? 'result-approved' : 'result-rejected'}`}>
            <strong>{result.ok ? 'Submitted' : "Couldn't submit"}</strong>
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}
