const SESSION_KEY = 'cluster-joe-session';
const SESSION_DAYS = 30;

// Decodes a JWT's payload without verifying the signature. That's fine here —
// this app has no real backend to verify against anyway (same ceiling as the
// rest of its security model), and the actual identity check already
// happened on Google's servers before this token was issued. We're just
// reading the email out of it.
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const ageDays = (Date.now() - session.signedInAt) / (1000 * 60 * 60 * 24);
    if (ageDays > SESSION_DAYS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedInAt: Date.now() }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
