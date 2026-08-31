import { WEBHOOK_URL } from '../config.js';

export async function postToSheet(payload) {
  if (!WEBHOOK_URL) return { ok: false, reason: 'no-webhook-configured' };
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

export function addLeadPayload(name) {
  return { type: 'Lead', name };
}

export function filingPayload(f) {
  return {
    type: 'Filing',
    lead: f.leadName,
    start: f.start,
    end: f.end,
    status: f.approved ? 'Approved' : 'Rejected',
    filedOn: f.filedOn,
    noticeGiven: f.noticeGiven,
    requiredNotice: f.weeksNeeded * 7,
    duration: f.duration,
    note: f.reason || '',
  };
}

export function eodPayload({ leadName, date, clientCalls, coachings, fathomLink, ticketMonitoring, hubspotFile, attendanceFile }) {
  return {
    type: 'EOD',
    lead: leadName,
    date,
    clientCalls,
    coachings,
    fathomLink,
    ticketMonitoring,
    hubspotFile,
    attendanceFile,
  };
}

export function aprCompletionPayload({ name, tl, occurrenceDate, hubspotLink, screenshot }) {
  return {
    type: 'AprCompletion',
    name,
    tl,
    occurrenceDate,
    hubspotLink,
    screenshot,
  };
}

export function eowrPayload({ tl, weekStart, sheetLink }) {
  return {
    type: 'EOWr',
    tl,
    weekStart,
    sheetLink,
  };
}

export function nominationPayload({ tl, agent, client, reason, month }) {
  return {
    type: 'TownHallNomination',
    tl,
    agent,
    client,
    reason,
    month,
  };
}
