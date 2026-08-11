# Cluster Joe

A hub for the cluster: a Home screen with announcements, birthdays, and meeting schedules, plus PTO
Calendar, EOD Form, and APR Notifications as separate sections, gated behind a Google Sign-In
allowlist. Same pattern as TeamHub: reads data from a Google Sheet (published as CSV) and writes new
records through a Google Apps Script webhook. No backend, deploys as a static site on Vercel.

## 1. Set up the Google Sheet

Create a new Google Sheet with these tabs:

**`TeamLeads`** — one column: `Name`

**`Filings`** — headers: `Timestamp, Lead, Start, End, Status, FiledOn, NoticeGivenDays, RequiredNoticeDays, DurationBusinessDays, Note`

**`Announcements`** — one column: `Message` (one announcement per row)

**`Birthdays`** — two columns: `Name`, `Date` (format `MM-DD`, e.g. `08-03` — no year, since it repeats yearly)

**`APRs`** — two columns: `Name`, `Date` (`YYYY-MM-DD`)

**`EOD`** — headers: `Timestamp, Lead, Date, ClientCalls, Coachings, FathomLink, TicketMonitoring, HubspotScreenshot, AttendanceScreenshot`

**`Users`** — one column: `Email` — the allowlist of who's allowed to sign in. Add each team lead's actual
Google email (any domain, doesn't need to match a company domain).

Then publish it so the app can read it:
**File → Share → Publish to web** → select "Entire document" → Publish.

Also click the green **Share** button and set general access to **"Anyone with the link"** (Viewer) —
Publish to web alone isn't enough; this is what actually makes the CSV export readable.

Grab the **Sheet ID** from its URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

Cluster Huddle and Townhall meetings are NOT read from a Sheet tab — they're pulled live from Google
Calendar instead (see step 2).

## 2. Set up the write-back webhook + Calendar read

In the same sheet: **Extensions → Apps Script**, delete the placeholder, and paste the contents of
[`apps-script/Code.gs`](./apps-script/Code.gs) from this repo.

This script needs two one-time authorizations the first time you run it — Drive access (for EOD
screenshots) and Calendar access (for Cluster Huddle / Townhall). Add these temporary functions,
run each once via the function dropdown + Run button, approve the permission prompt (Advanced → Go
to [project] unsafe → Allow), and confirm "Execution completed" with no error in the log:

```javascript
function authorizeDriveAccess() {
  var folder = DriveApp.createFolder('Cluster Joe EOD Screenshots - Test Auth');
  folder.setTrashed(true);
}

function authorizeCalendarAccess() {
  CalendarApp.getDefaultCalendar().getEvents(new Date(), new Date());
}
```

You can delete these afterward, or just leave them — they're harmless either way.

Then **Deploy → New deployment → type "Web app"**:
- Execute as: **Me**
- Who has access: **Anyone** (not "Anyone with Google account" — that redirects to a login page and silently fails)

Deploy, and copy the URL ending in `/exec`. That's your `VITE_WEBHOOK_URL`.

Cluster Huddle events on your calendar must be titled exactly `Cluster Huddle`. Townhall events just
need "Town Hall" somewhere in the title (the month is expected to vary, e.g. "August 2026 Town Hall").

**Whenever you edit this script**, redeploying requires: Deploy → Manage deployments → pencil icon →
Version: **New version** → Deploy. Skipping the "New version" step means your edits won't take effect.

## 3. Set up Google Sign-In

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create or select a project.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add your live Vercel URL (e.g. `https://cluster-joe.vercel.app`).
5. Create it, copy the **Client ID** (ends in `.apps.googleusercontent.com`). That's your
   `VITE_GOOGLE_CLIENT_ID`.
6. Add each allowed person's email to the `Users` tab in your Sheet (step 1).

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

## How data flows

- **Reading**: on load (and on "Refresh from sheet"), the app fetches each tab as CSV and renders
  it. Each tab fetch is validated by checking its expected first header column — if a tab is
  missing or misnamed, Google's CSV export silently falls back to serving a DIFFERENT tab's data
  rather than erroring, which this validation guards against. A missing/misnamed tab just shows an
  empty state instead.
- **Writing**: filing a VL or submitting an EOD sends a `POST` to the Apps Script webhook, which
  appends a row (and for EOD, uploads screenshots to Drive first). The UI updates optimistically for
  filings; EOD submissions wait for real confirmation since losing an attachment silently is worse
  than a few seconds' wait, and warn before letting you close the tab mid-submit. Announcements,
  Birthdays, APRs, and Users are managed directly in the Sheet — no in-app form for those.
- **Meetings**: Cluster Huddle and Townhall are read live from Google Calendar via the webhook's
  `doGet` endpoint, not from a Sheet tab — reflects cancellations/changes on next refresh, not
  instantly (no push updates).
- **Login**: Google Sign-In (any account) checked against the `Users` sheet's email list. Real
  identity verification happens on Google's side; the allowlist check itself runs in the browser,
  so this is meant to keep casual/accidental access out, not withstand a determined technical
  bypass — there's no real backend gating the underlying Sheet/webhook data itself.
- **Notice-period policy** (1–3 business days → 3 weeks, 4–9 → 4 weeks, 10+ → 6 weeks) lives in
  `src/lib/dates.js`. Weekends never count as "on VL" on the calendar view, regardless of a filed
  range spanning one.
- All "today" references are pinned to Pacific Time regardless of the viewer's own timezone.
- A lead can't file an overlapping VL for dates they already have an approved filing for — it's
  auto-rejected with a distinct message rather than silently duplicating.
- Filing a VL never files it on Hubstaff for you — that's a manual step, called out in the approval
  message alongside a screenshot reminder (`public/hubstaff-guide.png`).
