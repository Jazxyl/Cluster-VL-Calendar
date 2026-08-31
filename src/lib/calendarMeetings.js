import { WEBHOOK_URL } from '../config.js';

export async function fetchCalendarMeetings() {
  if (!WEBHOOK_URL) return { huddles: [], townhall: null };
  try {
    const res = await fetch(`${WEBHOOK_URL}?action=meetings&_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { huddles: [], townhall: null };
    const data = await res.json();
    if (!data.ok) return { huddles: [], townhall: null };
    return { huddles: data.huddles || [], townhall: data.townhall || null };
  } catch {
    return { huddles: [], townhall: null };
  }
}
