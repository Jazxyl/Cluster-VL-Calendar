export default function SetupNotice({ missing }) {
  if (missing === 'sheet') {
    return (
      <div className="wrap">
        <div className="card" style={{ padding: 24, marginTop: 40 }}>
          <h3 className="panel-title">Almost there</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            No <code>VITE_SHEET_ID</code> is set, so there's nothing to read data from yet. Add it as an
            environment variable (locally in <code>.env.local</code>, or in your Vercel project settings)
            and redeploy. See <code>README.md</code> for the full setup.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 14, marginBottom: 16 }}>
      <p className="empty-note" style={{ margin: 0 }}>
        No <code>VITE_WEBHOOK_URL</code> is set — filings will show locally but won't be written to the
        sheet. Add it as an environment variable and redeploy. See README.md.
      </p>
    </div>
  );
}
