import { useState, useEffect } from 'react';
import { todayPST } from '../lib/dates.js';
import { fileToBase64 } from '../lib/files.js';
import { postToSheet, eodPayload } from '../lib/webhook.js';

const EMPTY_FORM = {
  leadName: '',
  date: todayPST(),
  clientCalls: '',
  coachings: '',
  fathomLink: '',
  ticketMonitoring: '',
};

export default function EODFormTab({ leads, currentUserName, showSuccessModal, toast }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    leadName: currentUserName || leads?.[0]?.name || '',
  }));
  const [hubspotFile, setHubspotFile] = useState(null);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitting]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function missingFields() {
    const missing = [];
    if (!form.leadName) missing.push('Team lead');
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

      postToSheet(eodPayload({ ...form, hubspotFile: hubspotEncoded, attendanceFile: attendanceEncoded })).then(
        (res) => {
          if (!res.ok) toast('Submitted locally, but the sheet write failed — check the webhook URL');
        }
      );

      showSuccessModal('EOD submitted!');
      setForm((prev) => ({ ...EMPTY_FORM, leadName: prev.leadName }));
      setHubspotFile(null);
      setAttendanceFile(null);
    } catch (err) {
      setResult({ ok: false, message: err.message || 'Something went wrong reading a file.' });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="panel-title">EOD Form</h3>

      <div className="field">
        <label>Team lead</label>
        {!leads || leads.length === 0 ? (
          <select disabled>
            <option>Add a team lead in the Calendar tab first</option>
          </select>
        ) : (
          <select value={form.leadName} onChange={(e) => update('leadName', e.target.value)}>
            {leads.map((l) => (
              <option key={l.id} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>

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
        {submitting ? 'Submitting… keep this tab open' : 'Submit EOD'}
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
