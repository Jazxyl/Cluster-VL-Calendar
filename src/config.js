// Set these in a .env.local file (dev) or in Vercel's Environment Variables (prod).
// See README.md for how to get each value.

export const SHEET_ID = import.meta.env.VITE_SHEET_ID || '';
export const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || '';

// Tab (sheet) names inside the Google Sheet. Change these if you named your tabs differently.
export const TEAM_LEADS_TAB = 'TeamLeads';
export const FILINGS_TAB = 'Filings';
export const ANNOUNCEMENTS_TAB = 'Announcements';
export const BIRTHDAYS_TAB = 'Birthdays';
export const APRS_TAB = 'APRs';
export const EOD_TAB = 'EOD';

export function csvUrlForTab(tabName) {
  if (!SHEET_ID) return null;
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;
}
