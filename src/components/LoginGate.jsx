import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, csvUrlForTab, USERS_TAB } from '../config.js';
import { fetchTabAsObjects } from '../lib/csv.js';
import { decodeJwt, getSession, saveSession, clearSession } from '../lib/auth.js';

export default function LoginGate({ children }) {
  const [session, setSession] = useState(() => getSession());
  const [deniedEmail, setDeniedEmail] = useState(null);
  const [checking, setChecking] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (session) return; // already signed in, nothing to render
    if (!GOOGLE_CLIENT_ID) return;

    function renderButton() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      });
    }

    // The GIS script loads async — poll briefly until it's ready rather than
    // assuming it's already there by the time this component mounts.
    if (window.google) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          renderButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [session]);

  async function handleCredential(response) {
    setChecking(true);
    setDeniedEmail(null);
    const payload = decodeJwt(response.credential);
    const email = (payload?.email || '').toLowerCase().trim();

    const rows = await fetchTabAsObjects(csvUrlForTab(USERS_TAB), 'Email');
    const allowed = rows.some((r) => (r.Email || '').toLowerCase().trim() === email);

    if (allowed) {
      saveSession(email);
      setSession(getSession());
    } else {
      setDeniedEmail(email);
    }
    setChecking(false);
  }

  function handleSignOut() {
    clearSession();
    setSession(null);
  }

  if (session) {
    return (
      <div>
        <div className="auth-bar">
          Signed in as {session.email}
          <button className="ghost" onClick={handleSignOut} style={{ marginLeft: 10 }}>
            Sign out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="card" style={{ padding: 32, maxWidth: 420, margin: '80px auto', textAlign: 'center' }}>
        <p className="brand-eyebrow" style={{ textAlign: 'center' }}>
          Cluster Joe
        </p>
        <h1 style={{ marginBottom: 16 }}>Sign in</h1>

        {!GOOGLE_CLIENT_ID ? (
          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            No <code>VITE_GOOGLE_CLIENT_ID</code> is set. Add it as an environment variable and redeploy.
          </p>
        ) : (
          <>
            <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }} />
            {checking && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Checking access…</p>}
            {deniedEmail && (
              <div className="result-box result-rejected" style={{ marginTop: 12, textAlign: 'left' }}>
                <strong>Not authorized</strong>
                {deniedEmail} isn't on the allowed list. Ask your admin to add it to the Users sheet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
