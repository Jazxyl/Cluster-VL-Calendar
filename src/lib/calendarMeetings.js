import { WEBHOOK_URL } from '../config.js';

export async function fetchCalendarMeetings() {
  if (!WEBHOOK_URL) return { huddles: [], townhall: null };
  try {
    // cache: 'no-store' + a timestamp query param both guard against the
    // browser (or an intermediate cache) serving a stale response for this
    // URL — including a stale FAILURE from before a redeploy fixed things.
    const res = await fetch(`${WEBHOOK_URL}?action=meetings&_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { huddles: [], townhall: null };
    const data = await res.json();
    if (!data.ok) return { huddles: [], townhall: null };
    return { huddles: data.huddles || [], townhall: data.townhall || null };
  } catch {
    return { huddles: [], townhall: null };
  }
}
