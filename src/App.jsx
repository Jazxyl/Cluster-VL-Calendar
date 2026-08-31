import { useEffect, useState, useCallback } from 'react';
import {
  csvUrlForTab,
  TEAM_LEADS_TAB,
  FILINGS_TAB,
  ANNOUNCEMENTS_TAB,
  BIRTHDAYS_TAB,
  APRS_TAB,
  APR_COMPLETIONS_TAB,
  EOD_TAB,
  EOWR_TAB,
  USERS_TAB,
  NOMINATIONS_TAB,
  SHEET_ID,
  WEBHOOK_URL,
} from './config.js';
import { fetchTabAsObjects } from './lib/csv.js';
import { fetchCalendarMeetings } from './lib/calendarMeetings.js';
import { postToSheet, filingPayload, aprCompletionPayload, eowrPayload, nominationPayload } from './lib/webhook.js';
import { evaluateFiling, todayPST, rangesOverlap, parseUSDate } from './lib/dates.js';
import { colorForIndex } from './lib/colors.js';
import NavCards from './components/NavCards.jsx';
import HomeTab from './components/HomeTab.jsx';
import CalendarTab from './components/CalendarTab.jsx';
import FileVLTab from './components/FileVLTab.jsx';
import ReportsTab from './components/ReportsTab.jsx';
import APRTab from './components/APRTab.jsx';
import TownHallNominationsTab from './components/TownHallNominationsTab.jsx';
import SetupNotice from './components/SetupNotice.jsx';
import LoginGate from './components/LoginGate.jsx';
import ClockBar from './components/ClockBar.jsx';

const NAV_ITEMS = [
  { key: 'home', title: 'Home', desc: 'Announcements and schedules', icon: 'home' },
  { key: 'pto', title: 'PTO Calendar', desc: 'Leave schedule and coverage', icon: 'calendar' },
  { key: 'reports', title: 'Reports', desc: 'EODr and EOWr submissions', icon: 'form' },
  { key: 'apr', title: 'APR Notifications', desc: 'Upcoming reviews', icon: 'bell' },
  { key: 'nominations', title: 'Town Hall Nominations', desc: 'Recognize your agents', icon: 'star' },
];

async function safeFetchTab(tabName, expectedHeader) {
  try {
    return await fetchTabAsObjects(csvUrlForTab(tabName), expectedHeader);
  } catch {
    return [];
  }
}

function AppContent({ session }) {
  const isAdmin = (session?.role || '').toLowerCase() === 'admin';
  const currentUserName = session?.name || '';

  const [nav, setNav] = useState('home');
  const [ptoSubTab, setPtoSubTab] = useState('calendar');

  const [leads, setLeads] = useState([]);
  const [filings, setFilings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [huddles, setHuddles] = useState([]);
  const [townhall, setTownhall] = useState(null);
  const [aprs, setAprs] = useState([]);
  const [aprCompletions, setAprCompletions] = useState(new Set());
  const [eodEntries, setEodEntries] = useState([]);
  const [eowrEntries, setEowrEntries] = useState([]);
  const [adminNames, setAdminNames] = useState(new Set());
  const [nominations, setNominations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const loadData = useCallback(async () => {
    if (!SHEET_ID) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const tasks = [
      safeFetchTab(TEAM_LEADS_TAB, 'Name').then((rows) => {
        const nextLeads = rows
          .filter((r) => r.Name && r.Name.trim())
          .map((r, i) => ({ id: r.Name.trim(), name: r.Name.trim(), color: colorForIndex(i) }));
        setLeads(nextLeads);
      }),
      safeFetchTab(FILINGS_TAB, 'Timestamp').then((rows) => {
        const nextFilings = rows
          .filter((r) => r.Lead && r.Start && r.End)
          .map((r) => ({
            id: `${r.Lead}-${r.Start}-${r.End}-${r.Timestamp || ''}`,
            leadName: r.Lead,
            start: r.Start,
            end: r.End,
            approved: (r.Status || '').toLowerCase() === 'approved',
            filedOn: r.FiledOn || '',
            duration: Number(r.DurationBusinessDays) || 0,
            weeksNeeded: r.RequiredNoticeDays ? Math.round(Number(r.RequiredNoticeDays) / 7) : 0,
            noticeGiven: Number(r.NoticeGivenDays) || 0,
            reason: r.Note || '',
          }))
          .reverse();
        setFilings(nextFilings);
      }),
      safeFetchTab(ANNOUNCEMENTS_TAB, 'Message').then((rows) => {
        setAnnouncements(rows.filter((r) => r.Message && r.Message.trim()).map((r) => ({ message: r.Message.trim() })));
      }),
      safeFetchTab(BIRTHDAYS_TAB, 'Name').then((rows) => {
        setBirthdays(rows.filter((r) => r.Name && r.Date).map((r) => ({ name: r.Name.trim(), date: r.Date.trim() })));
      }),
      safeFetchTab(APRS_TAB, 'Name').then((rows) => {
        setAprs(
          rows
            .filter((r) => r.Name && r.Date)
            .map((r) => ({ name: r.Name.trim(), date: parseUSDate(r.Date.trim()), tl: (r.TL || '').trim() }))
            .filter((a) => a.date)
        );
      }),
      fetchCalendarMeetings().then((calendarMeetings) => {
        setHuddles(calendarMeetings.huddles);
        setTownhall(calendarMeetings.townhall);
      }),
      safeFetchTab(APR_COMPLETIONS_TAB, 'Timestamp').then((rows) => {
        const keys = rows
          .filter((r) => r.Name && r.OccurrenceDate)
          .map((r) => `${r.Name.trim().toLowerCase()}|${r.OccurrenceDate.trim()}`);
        setAprCompletions(new Set(keys));
      }),
      safeFetchTab(EOD_TAB, 'Timestamp').then((rows) => {
        setEodEntries(
          rows.filter((r) => r.Lead && r.Date).map((r) => ({ lead: r.Lead.trim(), date: r.Date.trim() }))
        );
      }),
      safeFetchTab(EOWR_TAB, 'Timestamp').then((rows) => {
        setEowrEntries(
          rows
            .filter((r) => r.TL && r.WeekStart)
            .map((r) => ({ tl: r.TL.trim(), weekStart: r.WeekStart.trim(), sheetLink: r.SheetLink || '' }))
        );
      }),
      safeFetchTab(USERS_TAB, 'Email').then((rows) => {
        const names = rows
          .filter((r) => r.Name && (r.Role || '').toLowerCase().trim() === 'admin')
          .map((r) => r.Name.trim().toLowerCase());
        setAdminNames(new Set(names));
      }),
      safeFetchTab(NOMINATIONS_TAB, 'Timestamp').then((rows) => {
        setNominations(
          rows
            .filter((r) => r.TL && r.Month)
            .map((r) => ({
              tl: r.TL.trim(),
              agent: r.Agent || '',
              client: r.Client || '',
              reason: r.Reason || '',
              month: r.Month.trim(),
            }))
        );
      }),
    ];

    try {
      await Promise.all(tasks);
    } catch (err) {
      setError(err.message || 'Failed to load the sheet');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const entries = filings.filter((f) => f.approved);
  const reportableLeads = leads.filter((l) => {
    const firstNameOfLead = l.name.trim().split(' ')[0].toLowerCase();
    return !adminNames.has(firstNameOfLead);
  });
  // The Users sheet stores short first names, but the dropdowns need the
  // full name from TeamLeads to actually match an option — resolve once here.
  const currentUserFullName =
    reportableLeads.find((l) => l.name.trim().split(' ')[0].toLowerCase() === (currentUserName || '').toLowerCase())
      ?.name || '';
  // Same resolution but against the FULL leads list (including admins), for
  // File a VL — admins take PTO too, unlike Reports which they're exempt from.
  const currentUserFullNameAll =
    leads.find((l) => l.name.trim().split(' ')[0].toLowerCase() === (currentUserName || '').toLowerCase())?.name ||
    '';

  async function submitFiling({ leadName, start, end, reason }) {
    const todayStr = todayPST();

    const duplicate = entries.find(
      (e) => e.leadName === leadName && rangesOverlap(start, end, e.start, e.end)
    );

    if (duplicate) {
      const record = {
        leadName,
        start,
        end,
        reason,
        filedOn: todayStr,
        duration: 0,
        weeksNeeded: 0,
        daysNeeded: 0,
        noticeGiven: 0,
        approved: false,
        rejectReason: 'duplicate',
        conflictStart: duplicate.start,
        conflictEnd: duplicate.end,
      };
      setFilings((prev) => [{ id: `${leadName}-${start}-${end}-local`, ...record }, ...prev]);
      postToSheet(filingPayload(record)).then((res) => {
        if (!res.ok) toast('Filed locally, but the sheet write failed — check the webhook URL');
      });
      return record;
    }

    const evalResult = evaluateFiling({ start, end, todayStr });
    const record = { leadName, start, end, reason, filedOn: todayStr, rejectReason: 'notice', ...evalResult };

    setFilings((prev) => [{ id: `${leadName}-${start}-${end}-local`, ...record }, ...prev]);

    postToSheet(filingPayload(record)).then((res) => {
      if (!res.ok) toast('Filed locally, but the sheet write failed — check the webhook URL');
    });

    return record;
  }

  function submitAprCompletion({ name, tl, occurrenceDate, hubspotLink, screenshot }) {
    const key = `${name.trim().toLowerCase()}|${occurrenceDate}`;
    setAprCompletions((prev) => new Set(prev).add(key));
    postToSheet(aprCompletionPayload({ name, tl, occurrenceDate, hubspotLink, screenshot })).then((res) => {
      if (!res.ok) toast('Marked locally, but the sheet write failed — check the webhook URL');
    });
  }

  async function submitEowr({ tl, weekStart, sheetLink }) {
    const record = { tl, weekStart, sheetLink };
    setEowrEntries((prev) => [record, ...prev]);
    const res = await postToSheet(eowrPayload(record));
    return res;
  }

  async function submitNomination({ tl, agent, client, reason, month }) {
    const record = { tl, agent, client, reason, month };
    setNominations((prev) => [record, ...prev]);
    const res = await postToSheet(nominationPayload(record));
    return res;
  }

  if (!SHEET_ID) {
    return <SetupNotice missing="sheet" />;
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <p className="brand-eyebrow">Cluster Joe</p>
          <h1>{NAV_ITEMS.find((n) => n.key === nav)?.title || 'Home'}</h1>
          <p className="sub">{NAV_ITEMS.find((n) => n.key === nav)?.desc || 'Your cluster, all in one place'}</p>
        </div>
        <div className="actions">
          <ClockBar />
          <button className="ghost" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh from sheet'}
          </button>
        </div>
      </div>

      {!WEBHOOK_URL && <SetupNotice missing="webhook" />}
      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: '#8a2f24' }}>{error}</div>}

      <NavCards items={NAV_ITEMS} active={nav} onSelect={setNav} />

      <div key={nav} className="tab-fade">
        {nav === 'home' && (
          <HomeTab
            announcements={announcements}
            birthdays={birthdays}
            huddles={huddles}
            townhall={townhall}
            aprs={aprs}
            isAdmin={isAdmin}
            currentUserName={currentUserName}
            onGoToApr={() => setNav('apr')}
            nominations={nominations}
            onGoToNominations={() => setNav('nominations')}
            currentUserFullName={currentUserFullNameAll}
          />
        )}

        {nav === 'pto' && (
          <div>
            <div className="tabnav">
              <button
                className={`tabbtn ${ptoSubTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setPtoSubTab('calendar')}
              >
                Calendar
              </button>
              <button
                className={`tabbtn ${ptoSubTab === 'file' ? 'active' : ''}`}
                onClick={() => setPtoSubTab('file')}
              >
                File a VL
              </button>
            </div>
            <div key={ptoSubTab} className="tab-fade">
              {ptoSubTab === 'calendar' && <CalendarTab leads={leads} entries={entries} />}
              {ptoSubTab === 'file' && (
                <FileVLTab
                  leads={leads}
                  filings={filings}
                  onSubmit={submitFiling}
                  currentUserName={currentUserFullNameAll}
                />
              )}
            </div>
          </div>
        )}

        {nav === 'reports' && (
          <ReportsTab
            leads={reportableLeads}
            eodEntries={eodEntries}
            eowrEntries={eowrEntries}
            isAdmin={isAdmin}
            currentUserName={currentUserFullName}
            onSubmitEowr={submitEowr}
          />
        )}
        {nav === 'apr' && (
          <APRTab
            aprs={aprs}
            isAdmin={isAdmin}
            currentUserName={currentUserName}
            aprCompletions={aprCompletions}
            onCompleteApr={submitAprCompletion}
          />
        )}
        {nav === 'nominations' && (
          <TownHallNominationsTab
            leads={leads}
            nominations={nominations}
            isAdmin={isAdmin}
            currentUserName={currentUserFullNameAll}
            onSubmit={submitNomination}
          />
        )}
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}

export default function App() {
  return <LoginGate>{(session) => <AppContent session={session} />}</LoginGate>;
}
