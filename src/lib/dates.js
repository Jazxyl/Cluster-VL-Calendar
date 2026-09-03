export function fmt(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// All "current date" references are pinned to Pacific Time so everyone on the
// cluster sees the same "today" regardless of their own timezone. This uses
// the IANA zone (not a fixed UTC-8 offset) so it correctly follows PST/PDT.
const PST_TIMEZONE = 'America/Los_Angeles';

export function todayPST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PST_TIMEZONE }).format(new Date());
}

export function todayPSTDateObj() {
  const [year, month, day] = todayPST().split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function businessDaysBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function calendarDaysBetween(fromStr, toStr) {
  const from = new Date(fromStr + 'T00:00:00');
  const to = new Date(toStr + 'T00:00:00');
  return Math.round((to - from) / 86400000);
}

// Notice-period policy:
// 1-3 business days  -> 3 weeks advance notice
// 4-9 business days  -> 4 weeks advance notice
// 10+ business days  -> 6 weeks advance notice
export function requiredNoticeWeeks(businessDays) {
  if (businessDays <= 3) return 3;
  if (businessDays <= 9) return 4;
  return 6;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

export function evaluateFiling({ start, end, todayStr = todayPST() }) {
  const duration = businessDaysBetween(start, end);
  const weeksNeeded = requiredNoticeWeeks(duration);
  const daysNeeded = weeksNeeded * 7;
  const noticeGiven = calendarDaysBetween(todayStr, start);
  const approved = noticeGiven >= daysNeeded;
  return { duration, weeksNeeded, daysNeeded, noticeGiven, approved };
}

const MONTH_LOOKUP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Handles dates coming out of the sheet in either form:
//   "MM-DD-YYYY" or "MM/DD/YYYY" — typed as plain text, as intended
//   "DD-Mon-YY" or "DD-Mon-YYYY" (e.g. "11-Feb-24") — what Google Sheets
//   actually exports if the cell got auto-converted to a real Date value
// Converts either to internal "YYYY-MM-DD", since that's the only format that
// sorts/compares correctly as plain text. 2-digit years are assumed 20XX.
function normalizeYear(yyyy) {
  return yyyy.length === 2 ? `20${yyyy}` : yyyy;
}

export function parseUSDate(input) {
  const raw = (input || '').trim();
  if (!raw) return '';

  const numeric = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
  if (numeric) {
    const [, mm, dd, yyyy] = numeric;
    return `${normalizeYear(yyyy)}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  const withMonthName = raw.match(/^(\d{1,2})-([A-Za-z]{3,})-(\d{2}|\d{4})$/);
  if (withMonthName) {
    const [, dd, monthName, yyyy] = withMonthName;
    const mm = MONTH_LOOKUP[monthName.toLowerCase().slice(0, 3)];
    if (mm) return `${normalizeYear(yyyy)}-${String(mm).padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  return '';
}

// Converts an internal "YYYY-MM-DD" date back to "MM-DD-YYYY" for display.
export function formatUSDate(isoDate) {
  const parts = (isoDate || '').split('-');
  if (parts.length !== 3) return isoDate;
  const [yyyy, mm, dd] = parts;
  return `${mm}-${dd}-${yyyy}`;
}

// For recurring birthdays stored as "MM-DD". Returns days until the next
// occurrence, wrapping to next year if this year's date has already passed.
export function daysUntilBirthday(mmdd, todayStr = todayPST()) {
  const [year] = todayStr.split('-');
  const today = new Date(todayStr + 'T00:00:00');
  let target = new Date(`${year}-${mmdd}T00:00:00`);
  if (target < today) {
    target = new Date(`${Number(year) + 1}-${mmdd}T00:00:00`);
  }
  return Math.round((target - today) / 86400000);
}

// Fixed to the day this overdue-tracking went live. Prevents every
// historical APR date on file from instantly flooding in as "overdue" the
// moment the feature launches — only cycles landing on or after this date
// ever get evaluated. Change this if you need to re-anchor later.
const APR_TRACKING_ANCHOR = '2026-08-12';

// Finds the currently-relevant annual occurrence for an APR date, anchored
// so nothing before APR_TRACKING_ANCHOR is ever considered. Starts at the
// first occurrence on/after the anchor, then keeps advancing a full year at
// a time as long as doing so is still on/before today — so it keeps
// tracking correctly cycle after cycle as real time passes, not just once.
export function anchoredAprOccurrence(isoDate, todayStr = todayPST()) {
  const mmdd = (isoDate || '').slice(5);
  if (mmdd.length !== 5) return '';

  let year = Number(APR_TRACKING_ANCHOR.slice(0, 4));
  let candidate = `${year}-${mmdd}`;
  if (candidate < APR_TRACKING_ANCHOR) {
    year += 1;
    candidate = `${year}-${mmdd}`;
  }

  while (true) {
    const next = `${year + 1}-${mmdd}`;
    if (next <= todayStr) {
      year += 1;
      candidate = next;
    } else {
      break;
    }
  }

  return candidate;
}

// Positive = N days overdue (anchored occurrence already passed).
// Negative = N days until due. Zero = due today.
export function daysFromAprDue(isoDate, todayStr = todayPST()) {
  const due = anchoredAprOccurrence(isoDate, todayStr);
  if (!due) return null;
  return calendarDaysBetween(due, todayStr);
}

// Shows as relevant if due within the next `windowDays` (default 2 weeks)
// OR already overdue by any amount — an overdue APR keeps showing (flagged,
// not hidden) until it's actually completed.
export function isAprRelevant(isoDate, todayStr = todayPST(), windowDays = 14) {
  const days = daysFromAprDue(isoDate, todayStr);
  return days !== null && days >= -windowDays;
}

// A due date alone doesn't mean overdue — there's a 7-day grace period.
// APR date Aug 12 → still just "due" through Aug 18, turns overdue (red)
// starting Aug 19 (7 days after the due date).
export function isAprOverdue(isoDate, todayStr = todayPST(), graceDays = 7) {
  const days = daysFromAprDue(isoDate, todayStr);
  return days !== null && days >= graceDays;
}

// ---- Week-start (Monday-anchored) helpers for EOWr ----

export function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return fmt(d);
}

export function addDaysISO(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return fmt(d);
}

// "2026-08-03" -> "WS0803"
export function formatWeekLabel(mondayISO) {
  const parts = (mondayISO || '').split('-');
  if (parts.length !== 3) return mondayISO;
  const [, mm, dd] = parts;
  return `WS${mm}${dd}`;
}

// The Monday of LAST week specifically (not this week, since you only
// report on a week that's actually finished).
export function lastWeekStart(todayStr = todayPST()) {
  return addDaysISO(mondayOf(todayStr), -7);
}

// Generates `count` Monday dates going backward from last week, in
// CHRONOLOGICAL order (oldest first, most recent/last-week last) — so a
// native <select> naturally scrolls to show the selected "last week" value
// sitting near the bottom, with older weeks above it. Auto-shifts forward
// every Monday since it's always computed relative to the real today.
export function recentWeekStarts(todayStr = todayPST(), count = 104) {
  const weeks = [];
  let cursor = lastWeekStart(todayStr);
  for (let i = 0; i < count; i++) {
    weeks.push(cursor);
    cursor = addDaysISO(cursor, -7);
  }
  return weeks.reverse();
}

// All Monday dates (YYYY-MM-DD) whose date falls within the given
// year/month (month is 1-12). A week is grouped under whichever month its
// Monday lands in, even if the rest of that week spills into the next month.
export function mondaysInMonth(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const mondays = [];
  const d = new Date(first);
  while (d <= last) {
    if (d.getDay() === 1) mondays.push(fmt(d));
    d.setDate(d.getDate() + 1);
  }
  return mondays;
}

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(year, month) {
  return `${MONTH_FULL_NAMES[month - 1]} ${year}`;
}

// ---- Month-cycle helpers for Town Hall Nominations ----

export function currentMonthKey(todayStr = todayPST()) {
  return todayStr.slice(0, 7); // "YYYY-MM"
}

export function dayOfMonth(todayStr = todayPST()) {
  return Number(todayStr.slice(8, 10));
}

// Submissions accepted the 1st through the 16th (inclusive) of each month.
export function isNominationWindowOpen(todayStr = todayPST()) {
  return dayOfMonth(todayStr) <= 16;
}

// Reminder banner shows the 13th through the 16th — 3 days before the
// deadline through the deadline itself.
export function isNominationReminderWindow(todayStr = todayPST()) {
  const d = dayOfMonth(todayStr);
  return d >= 13 && d <= 16;
}

export function monthKeyLabel(monthKey) {
  const [y, m] = (monthKey || '').split('-').map(Number);
  if (!y || !m) return monthKey;
  return monthLabel(y, m);
}

// Formats a "MM-DD" birthday as "Aug 3" for display.
const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatBirthdayDate(mmdd) {
  const [mm, dd] = (mmdd || '').split('-');
  const monthIdx = Number(mm) - 1;
  return `${SHORT_MONTH_NAMES[monthIdx] || mm} ${Number(dd)}`;
}

// ---- Expansion Bonus maturity (one-time, non-recurring — literal date math) ----

export function daysSinceDate(dateStr, todayStr = todayPST()) {
  if (!dateStr) return null;
  return calendarDaysBetween(dateStr, todayStr);
}

export function isExpansionBonusMature(startDate, todayStr = todayPST(), maturityDays = 30) {
  const days = daysSinceDate(startDate, todayStr);
  return days !== null && days >= maturityDays;
}
