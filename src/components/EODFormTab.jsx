import { EOD_FORM_URL } from '../config.js';

export default function EODFormTab() {
  if (!EOD_FORM_URL) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3 className="panel-title">Almost there</h3>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          No <code>VITE_EOD_FORM_URL</code> is set yet. Open your Google Form, click <strong>Send</strong> →
          the embed icon (<code>&lt;&gt;</code>) → copy the URL inside the <code>src="..."</code> of the
          code shown, and add it as an environment variable.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <iframe
        src={EOD_FORM_URL}
        title="EOD Form"
        width="100%"
        height="900"
        style={{ border: 'none', display: 'block' }}
      >
        Loading form…
      </iframe>
    </div>
  );
}
