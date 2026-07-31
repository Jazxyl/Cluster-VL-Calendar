import { WEBHOOK_URL } from '../config.js';

export async function fetchCalendarMeetings() {
  if (!WEBHOOK_URL) return { huddles: [], townhall: null };
  try {
    const res = await fetch(`${WEBHOOK_URL}?action=meetings`);
    const data = await res.json();
    if (!data.ok) return { huddles: [], townhall: null };
    return { huddles: data.huddles || [], townhall: data.townhall || null };
  } catch {
    return { huddles: [], townhall: null };
  }
}
