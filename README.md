# Cluster Joe

A hub for the cluster: Home, PTO Calendar, Reports (EODr/EOWr), APR Notifications, Town Hall
Nominations, and Profiles — gated behind Google Sign-In with an allowlist. Reads data from a Google
Sheet (published as CSV) and writes new records through a Google Apps Script webhook. No backend,
deploys as a static site on Vercel.

## 1. Set up the Google Sheet

Create a new Google Sheet with these tabs. Most sheets auto-create themselves the first time
someone submits through the app — those are marked **(auto)** below and don't need to be made by
hand, only the ones without that marker.

**`TeamLeads`** — columns: `Name`, `PhotoLink` (optional — a direct image URL for their Profiles
card; see the note on Google Drive links below).

**`Filings`** — headers: `Timestamp, Lead, Start, End, Status, FiledOn, NoticeGivenDays, RequiredNoticeDays, DurationBusinessDays, Note`

**`Announcements`** — one column: `Message` (one announcement per row)

**`Birthdays`** — two columns: `Name` (full name, matching TeamLeads), `Date` (format `MM-DD`, e.g.
`08-03` — no year, since it repeats yearly). Type these as plain text, not real dates — see the
troubleshooting note below if a date shows up right-aligned or in the wrong format.

**`APRs`** — three columns: `Name` (the agent), `Date` (`MM-DD-YYYY`, `MM/DD/YYYY`, or whatever
Google Sheets auto-formats it to if the cell becomes a real date — the app tolerates several
formats), `TL` (which team lead owns this agent — must match that person's *short first name* as
listed in the `Users` tab's `Name` column, e.g. `Michelle`, not `Michelle Medrano`).

**`EOD`** (auto) — headers: `Timestamp, Lead, Date, ClientCalls, Coachings, FathomLink, TicketMonitoring, HubspotScreenshot, AttendanceScreenshot`

**`Users`** — three columns: `Email`, `Name`, `Role`. `Email` is the sign-in allowlist. `Name` is
the person's *short first name* (e.g. `Michelle`, not `Michelle Medrano`) — used to match them
against the `APRs.TL` column and to resolve their full name from `TeamLeads` for defaulting form
dropdowns. `Role` is either `TL` or `Admin` — Admins see cluster-wide views instead of personal
ones, and are excluded from the Reports submission roster (they can still file PTO normally).

**`AprCompletions`** (auto) — headers: `Timestamp, Name, TL, OccurrenceDate, HubspotLink, ScreenshotLink`

**`EOWr`** (auto) — headers: `Timestamp, TL, WeekStart, SheetLink`

**`TownHallNominations`** (auto) — headers: `Timestamp, TL, Agent, Client, Reason, Month, RecordingLink`

Then publish it so the app can read it: **File → Share → Publish to web** → select "Entire
document" → Publish. Also click the green **Share** button and set general access to **"Anyone
with the link"** (Viewer) — Publish to web alone isn't enough; this is what actually makes the CSV
export readable.

Grab the **Sheet ID** from its URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

### Getting a working Google Drive image link for PhotoLink

Google Drive's normal "share" link (something like `.../file/d/FILE_ID/view?usp=sharing`) opens an
HTML preview page, not the raw image — pasting it directly into `PhotoLink` will show a broken
image icon. Instead:

1. Right-click the image in Drive → **Share** → set general access to **"Anyone with the link" →
   Viewer**.
2. Click **Copy link**, and pull out the `FILE_ID` (the long string between `/d/` and `/view`).
3. Use this format instead: `https://drive.google.com/uc?export=view&id=FILE_ID`

If that specific format 404s for a particular file, try `https://lh3.googleusercontent.com/d/FILE_ID`
as a fallback — Google's direct-image endpoints have been known to be inconsistent. If neither
loads or the link's permissions ever change, the app falls back gracefully to a colored circle with
that person's initials rather than showing a broken image.

## 2. Set up the write-back webhook + Calendar read

In the same sheet: **Extensions → Apps Script**, delete the placeholder, and paste the contents of
[`apps-script/Code.gs`](./apps-script/Code.gs) from this repo.

This script needs two one-time authorizations the first time you run it — Drive access (for
screenshots) and Calendar access (for Cluster Huddle / Townhall). Add these temporary functions,
run each once via the function dropdown + Run button, approve the permission prompt (Advanced → Go
to [project] unsafe → Allow), and confirm "Execution completed" with no error in the log:

```javascript
function authorizeDriveAccess() {
  var folder = DriveApp.createFolder('Cluster Joe Test Auth');
  folder.setTrashed(true);
}

function authorizeCalendarAccess() {
  CalendarApp.getDefaultCalendar().getEvents(new Date(), new Date());
}
```

You can delete these afterward, or just leave them — they're harmless either way.

Then **Deploy → New deployment → type "Web app"**:
- Execute as: **Me**
- Who has access: **Anyone** (not "Anyone with Google account" — that redirects to a login page and
  silently fails)

Deploy, and copy the URL ending in `/exec`. That's your `VITE_WEBHOOK_URL`.

Cluster Huddle events on your calendar must be titled exactly `Cluster Huddle`. Townhall events just
need "Town Hall" somewhere in the title (the month is expected to vary, e.g. "August 2026 Town
Hall").

**Whenever you edit this script**, redeploying requires: Deploy → Manage deployments → pencil icon →
Version: **New version** → Deploy. Skipping the "New version" step means your edits won't take
effect.

## 3. Set up Google Sign-In

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create or select a project.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add your live Vercel URL (e.g.
   `https://cluster-joe.vercel.app`).
5. Create it, copy the **Client ID** (ends in `.apps.googleusercontent.com`). That's your
   `VITE_GOOGLE_CLIENT_ID`.
6. Under **Audience**, publish the app (moves it out of "Testing" mode) so any Google account can
   attempt sign-in — the real gate is the `Users` sheet, not Google's own test-user cap.
7. Add each allowed person's email, short name, and role to the `Users` tab in your Sheet.

Sessions last 30 days before someone needs to sign in again.

## 4. Configure the app

Copy `.env.example` to `.env.local` and fill in all three values:

```
VITE_SHEET_ID=your_google_sheet_id_here
VITE_WEBHOOK_URL=https://script.google.com/macros/s/your_deployment_id/exec
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

## 5. Run it locally

```bash
npm install
npm run dev
```

## 6. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the GitHub repo.
3. In the project's **Settings → Environment Variables**, add all three variables above with the
   same values as your `.env.local`.
4. Deploy. Vercel auto-detects Vite; no build config changes needed.

## Features overview

- **Home**: APR banner (filtered to your own agents unless you're an Admin), a Town Hall Nomination
  reminder banner (shows only if you haven't submitted this month, only the 13th–16th, disappears
  the moment you submit), announcements, Cluster Huddle / Townhall (live from Google Calendar),
  birthdays this month.
- **PTO Calendar**: leave filing with notice-period policy (1–3 business days → 3 weeks notice, 4–9
  → 4 weeks, 10+ → 6 weeks), duplicate-filing prevention, weekend exclusion, defaults the "Team
  lead" field to whoever's logged in.
- **Reports**: folder-style EODr / EOWr tabs, each with Submit and Status sub-tabs. Status shows a
  team-wide checklist (checkmark or empty circle) for the selected day (EODr) or week (EOWr).
  Admin-role users get a fourth "Admin" tab with compliance trackers, and are excluded from the
  submission roster entirely (they don't need to file EOD/EOWr themselves).
- **APR Notifications**: dates recur annually (like birthdays) rather than being one-time events.
  "Upcoming" means due within 2 weeks or already overdue — overdue ones (7+ days past due) stay
  visible in red until completed, rather than silently disappearing. Completing one requires a
  Hubspot link and screenshot. Overdue tracking is anchored to when the feature launched, so
  historical dates already on file don't all flood in as overdue at once.
- **Town Hall Nominations**: one nomination per team lead per month, TL/Agent/Client/Reason plus an
  optional recording link. Submission window is the 1st–16th of each month; locked after that with
  a clear message. Status is a simple submitted/pending checklist, same pattern as Reports.
- **Profiles**: a card per team lead — photo (or colored initials if none set), email (from
  `Users`), birthday (from `Birthdays`) — all cross-referenced by name, no duplicate data entry.

## How data flows

- **Reading**: on load (and on "Refresh from sheet"), the app fetches each tab as CSV. Each fetch is
  validated by checking its expected first header column — if a tab is missing or misnamed,
  Google's CSV export silently falls back to serving a DIFFERENT tab's data rather than erroring,
  which this validation guards against. A missing/misnamed tab just shows an empty state instead.
- **Writing**: every submission (VL filing, EOD, EOWr, APR completion, nomination) sends a `POST` to
  the Apps Script webhook, which appends a row (uploading any screenshots to Drive first). Writes
  update the UI optimistically; failures show a toast rather than failing silently.
- **Meetings**: Cluster Huddle and Townhall are read live from Google Calendar via the webhook's
  `doGet` endpoint, not from a Sheet tab.
- **Login**: Google Sign-In (any account) checked against the `Users` sheet's email list. Real
  identity verification happens on Google's side; the allowlist check itself runs in the browser, so
  this is meant to keep casual/accidental access out, not withstand a determined technical bypass.
- **Name matching**: `Users.Name` and `APRs.TL` use short first names; `TeamLeads.Name`,
  `EOWr.TL`, and `TownHallNominations.TL` use full names. The app resolves between them by matching
  first names — if two team leads ever share a first name, this could cause a mismatch; flag it if
  that becomes a real scenario and the matching can be switched to full names instead.
- All "today" references are pinned to Pacific Time regardless of the viewer's own timezone.
