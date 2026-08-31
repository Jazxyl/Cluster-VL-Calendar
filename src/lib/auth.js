const SESSION_KEY = 'cluster-joe-session';
const SESSION_DAYS = 30;

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

export function saveSession(email, name, role) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email, name: name || '', role: role || 'TL', signedInAt: Date.now() })
  );
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
