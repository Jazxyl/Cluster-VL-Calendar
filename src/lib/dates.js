export function fmt(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function normalizeYear(yyyy) {
  return yyyy.length === 2 ? `20${yyyy}` : yyyy;
}

export function parseUSDate(input) {
  const raw = (input || '').trim();
  if (!raw) return '';

  const isoStyle = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoStyle) {
    const [, yyyy, mm, dd] = isoStyle;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

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

export function formatUSDate(isoDate) {
  const parts = (isoDate || '').split('-');
  if (parts.length !== 3) return isoDate;
  const [yyyy, mm, dd] = parts;
  return `${mm}-${dd}-${yyyy}`;
}

export function daysUntilBirthday(mmdd, todayStr = todayPST()) {
  const [year] = todayStr.split('-');
  const today = new Date(todayStr + 'T00:00:00');
  let target = new Date(`${year}-${mmdd}T00:00:00`);
  if (target < today) {
    target = new Date(`${Number(year) + 1}-${mmdd}T00:00:00`);
  }
  return Math.round((target - today) / 86400000);
}

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatBirthdayDate(mmdd) {
  const [mm, dd] = (mmdd || '').split('-');
  const monthIdx = Number(mm) - 1;
  return `${SHORT_MONTH_NAMES[monthIdx] || mm} ${Number(dd)}`;
}

const APR_TRACKING_ANCHOR = '2026-08-12';

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
    } else break;
  }
  return candidate;
}

export function daysFromAprDue(isoDate, todayStr = todayPST()) {
  const due = anchoredAprOccurrence(isoDate, todayStr);
  if (!due) return null;
  return calendarDaysBetween(due, todayStr);
}

export function isAprRelevant(isoDate, todayStr = todayPST(), windowDays = 14) {
  const days = daysFromAprDue(isoDate, todayStr);
  return days !== null && days >= -windowDays;
}

export function isAprOverdue(isoDate, todayStr = todayPST(), graceDays = 7) {
  const days = daysFromAprDue(isoDate, todayStr);
  return days !== null && days >= graceDays;
}

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

export function formatWeekLabel(mondayISO) {
  const parts = (mondayISO || '').split('-');
  if (parts.length !== 3) return mondayISO;
  const [, mm, dd] = parts;
  return `WS${mm}${dd}`;
}

export function lastWeekStart(todayStr = todayPST()) {
  return addDaysISO(mondayOf(todayStr), -7);
}

export function recentWeekStarts(todayStr = todayPST(), count = 104) {
  const weeks = [];
  let cursor = lastWeekStart(todayStr);
  for (let i = 0; i < count; i++) {
    weeks.push(cursor);
    cursor = addDaysISO(cursor, -7);
  }
  return weeks.reverse();
}

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

const MONTH_FULL_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function monthLabel(year, month) {
  return `${MONTH_FULL_NAMES[month - 1]} ${year}`;
}

export function currentMonthKey(todayStr = todayPST()) {
  return todayStr.slice(0, 7);
}

export function dayOfMonth(todayStr = todayPST()) {
  return Number(todayStr.slice(8, 10));
}

export function isNominationWindowOpen(todayStr = todayPST()) {
  return dayOfMonth(todayStr) <= 16;
}

export function isNominationReminderWindow(todayStr = todayPST()) {
  const d = dayOfMonth(todayStr);
  return d >= 13 && d <= 16;
}

export function monthKeyLabel(monthKey) {
  const [y, m] = (monthKey || '').split('-').map(Number);
  if (!y || !m) return monthKey;
  return monthLabel(y, m);
}

export function daysSinceDate(dateStr, todayStr = todayPST()) {
  if (!dateStr) return null;
  return calendarDaysBetween(dateStr, todayStr);
}

export function isExpansionBonusMature(startDate, todayStr = todayPST(), maturityDays = 30) {
  const days = daysSinceDate(startDate, todayStr);
  return days !== null && days >= maturityDays;
}
