# Cluster Joe

A hub for the cluster: a Home screen with announcements, birthdays, and meeting schedules, plus PTO
Calendar, EOD Form, and APR Notifications as separate sections. Same pattern as TeamHub: reads data
from a Google Sheet (published as CSV) and writes new records through a Google Apps Script webhook.
No backend, deploys as a static site on Vercel.

## 1. Set up the Google Sheet

Create a new Google Sheet with these tabs:

**`TeamLeads`** — one column: `Name`

**`Filings`** — headers: `Timestamp, Lead, Start, End, Status, FiledOn, NoticeGivenDays, RequiredNoticeDays, DurationBusinessDays, Note`

**`Announcements`** — one column: `Message` (one announcement per row)

**`Birthdays`** — two columns: `Name`, `Date` (format `MM-DD`, e.g. `08-03` — no year, since it repeats yearly)

**`Meetings`** — four columns: `Type` (`Cluster` or `Townhall`), `Date` (`YYYY-MM-DD`), `Time` (free text, e.g. `3:00 PM`), `Note` (optional, e.g. room/link)

**`APRs`** — two columns: `Name`, `Date` (`YYYY-MM-DD`)

Then publish it so the app can read it:
**File → Share → Publish to web** → select "Entire document" → Publish.

Also click the green **Share** button and set general access to **"Anyone with the link"** (Viewer) —
Publish to web alone isn't enough; this is what actually makes the CSV export readable.

Grab the **Sheet ID** from its URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

## 2. Set up the write-back webhook

In the same sheet: **Extensions → Apps Script**, delete the placeholder, and paste the contents of
[`apps-script/Code.gs`](./apps-script/Code.gs) from this repo.

Then **Deploy → New deployment → type "Web app"**:
- Execute as: **Me**
- Who has access: **Anyone** (not "Anyone with Google account" — that redirects to a login page and silently fails)

Deploy, and copy the URL ending in `/exec`. That's your `VITE_WEBHOOK_URL`.

## 3. Set up the EOD Form embed

Open your Google Form → **Send** → the embed icon (`<>`) → copy the URL inside `src="..."` from the
code shown. That's your `VITE_EOD_FORM_URL`.

## 4. Configure the app

Copy `.env.example` to `.env.local` and fill in all three values:

```
VITE_SHEET_ID=your_google_sheet_id_here
VITE_WEBHOOK_URL=https://script.google.com/macros/s/your_deployment_id/exec
VITE_EOD_FORM_URL=https://docs.google.com/forms/d/e/your_form_id/viewform?embedded=true
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

- **Reading**: on load (and on "Refresh from sheet"), the app fetches all six tabs as CSV and
  renders them. Each tab fetch fails independently — a missing or misnamed tab (e.g. you haven't
  set up `Birthdays` yet) just shows an empty state for that section instead of breaking the whole
  app.
- **Writing**: filing a VL sends a `POST` to the Apps Script webhook, which appends a row to the
  `Filings` tab. The UI updates optimistically right away; hit "Refresh from sheet" to confirm the
  write actually landed, since cross-origin responses from Apps Script aren't readable by the
  browser. Announcements, Birthdays, Meetings, and APRs are managed directly in the Sheet — there's
  no in-app form for those, just edit the rows and refresh.
- **Notice-period policy** (1–3 business days → 3 weeks, 4–9 → 4 weeks, 10+ → 6 weeks) lives in
  `src/lib/dates.js`.
- All "today" references are pinned to Pacific Time regardless of the viewer's own timezone, so
  everyone sees the same "today."
- Approved filings automatically populate the PTO Calendar. Rejected ones are logged but never
  appear on the calendar.
- Filing a VL never files it on Hubstaff for you — that's a manual step, called out in the approval
  message alongside a screenshot reminder (`public/hubstaff-guide.png`).

