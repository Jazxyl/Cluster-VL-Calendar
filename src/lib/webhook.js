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

export function nominationPayload({ tl, agent, client, reason, month, recordingLink }) {
  return {
    type: 'TownHallNomination',
    tl,
    agent,
    client,
    reason,
    month,
    recordingLink,
  };
}

// timestamp is generated client-side (not left to Apps Script's own new Date())
// so the client always has a stable, known ID for this exact submission —
// needed to later match it up with a completion record when an Admin
// processes it, since the fire-and-forget webhook never returns data back.
export function expansionBonusPayload({ timestamp, tl, agent, client, startDate, hubspotLink }) {
  return {
    type: 'ExpansionBonus',
    timestamp,
    tl,
    agent,
    client,
    startDate,
    hubspotLink,
  };
}

export function expansionBonusCompletionPayload({ originalTimestamp, processedBy, notes }) {
  return {
    type: 'ExpansionBonusCompletion',
    originalTimestamp,
    processedBy,
    notes,
  };
}

export function coachingCompliancePayload({ tl, agent, type, fathomLink }) {
  return {
    type: 'CoachingCompliance',
    tl,
    agent,
    coachingType: type,
    fathomLink,
  };
}

export function addAgentPayload({ name, tl, hubstaffId, date }) {
  return {
    type: 'AddAgent',
    name,
    tl,
    hubstaffId,
    date,
  };
}

export function updateAgentStatusPayload({ name, tl, hubstaffId, status }) {
  return {
    type: 'UpdateAgentStatus',
    name,
    tl,
    hubstaffId,
    status,
  };
}

export function editAgentPayload({ originalName, tl, originalHubstaffId, newName, newHubstaffId, newDate }) {
  return {
    type: 'EditAgent',
    originalName,
    tl,
    originalHubstaffId,
    newName,
    newHubstaffId,
    newDate,
  };
}
