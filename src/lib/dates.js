// All "current date" references are pinned to Pacific Time so everyone on the
// cluster sees the same "today" regardless of their own timezone. This uses
// the IANA zone (not a fixed UTC-8 offset) so it correctly follows PST/PDT.
const PST_TIMEZONE = 'America/Los_Angeles';

export function todayPST() {
  // en-CA locale formats as YYYY-MM-DD, which is exactly what we store/compare.
  return new Intl.DateTimeFormat('en-CA', { timeZone: PST_TIMEZONE }).format(new Date());
}

export function todayPSTDateObj() {
  const [year, month, day] = todayPST().split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function fmt(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export function evaluateFiling({ start, end, todayStr = todayPST() }) {
  const duration = businessDaysBetween(start, end);
  const weeksNeeded = requiredNoticeWeeks(duration);
  const daysNeeded = weeksNeeded * 7;
  const noticeGiven = calendarDaysBetween(todayStr, start);
  const approved = noticeGiven >= daysNeeded;
  return { duration, weeksNeeded, daysNeeded, noticeGiven, approved };
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
