import { useEffect, useState, useCallback } from 'react';
import {
  csvUrlForTab,
  TEAM_LEADS_TAB,
  FILINGS_TAB,
  ANNOUNCEMENTS_TAB,
  BIRTHDAYS_TAB,
  APRS_TAB,
  SHEET_ID,
  WEBHOOK_URL,
} from './config.js';
import { fetchTabAsObjects } from './lib/csv.js';
import { fetchCalendarMeetings } from './lib/calendarMeetings.js';
import { postToSheet, filingPayload } from './lib/webhook.js';
import { evaluateFiling, todayPST } from './lib/dates.js';
import { colorForIndex } from './lib/colors.js';
import NavCards from './components/NavCards.jsx';
import HomeTab from './components/HomeTab.jsx';
import CalendarTab from './components/CalendarTab.jsx';
import FileVLTab from './components/FileVLTab.jsx';
import EODFormTab from './components/EODFormTab.jsx';
import APRTab from './components/APRTab.jsx';
import SetupNotice from './components/SetupNotice.jsx';

const NAV_ITEMS = [
  { key: 'home', title: 'Home', desc: 'Announcements and schedules', icon: 'home' },
  { key: 'pto', title: 'PTO Calendar', desc: 'Leave schedule and coverage', icon: 'calendar' },
  { key: 'eod', title: 'EOD Form', desc: 'Daily report submission', icon: 'form' },
  { key: 'apr', title: 'APR Notifications', desc: 'Upcoming reviews', icon: 'bell' },
];

// Fetch a tab, but never let a missing/misnamed tab take down the whole app —
// each data source degrades to an empty list on its own.
async function safeFetchTab(tabName) {
  try {
    return await fetchTabAsObjects(csvUrlForTab(tabName));
  } catch {
    return [];
  }
}

export default function App() {
  const [nav, setNav] = useState('home');
  const [ptoSubTab, setPtoSubTab] = useState('calendar');

  const [leads, setLeads] = useState([]);
  const [filings, setFilings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [huddles, setHuddles] = useState([]);
  const [townhall, setTownhall] = useState(null);
  const [aprs, setAprs] = useState([]);

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
    try {
      const [leadRows, filingRows, announcementRows, birthdayRows, aprRows, calendarMeetings] = await Promise.all([
        safeFetchTab(TEAM_LEADS_TAB),
        safeFetchTab(FILINGS_TAB),
        safeFetchTab(ANNOUNCEMENTS_TAB),
        safeFetchTab(BIRTHDAYS_TAB),
        safeFetchTab(APRS_TAB),
        fetchCalendarMeetings(),
      ]);

      const nextLeads = leadRows
        .filter((r) => r.Name && r.Name.trim())
        .map((r, i) => ({ id: r.Name.trim(), name: r.Name.trim(), color: colorForIndex(i) }));

      const nextFilings = filingRows
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

      const nextAnnouncements = announcementRows
        .filter((r) => r.Message && r.Message.trim())
        .map((r) => ({ message: r.Message.trim() }));

      const nextBirthdays = birthdayRows
        .filter((r) => r.Name && r.Date)
        .map((r) => ({ name: r.Name.trim(), date: r.Date.trim() }));

      const nextAprs = aprRows
        .filter((r) => r.Name && r.Date)
        .map((r) => ({ name: r.Name.trim(), date: r.Date.trim() }));

      setLeads(nextLeads);
      setFilings(nextFilings);
      setAnnouncements(nextAnnouncements);
      setBirthdays(nextBirthdays);
      setHuddles(calendarMeetings.huddles);
      setTownhall(calendarMeetings.townhall);
      setAprs(nextAprs);
    } catch (err) {
      setError(err.message || 'Failed to load the sheet');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const entries = filings.filter((f) => f.approved);

  async function submitFiling({ leadName, start, end, reason }) {
    const todayStr = todayPST();
    const evalResult = evaluateFiling({ start, end, todayStr });
    const record = { leadName, start, end, reason, filedOn: todayStr, ...evalResult };

    setFilings((prev) => [{ id: `${leadName}-${start}-${end}-local`, ...record }, ...prev]);

    postToSheet(filingPayload(record)).then((res) => {
      if (!res.ok) toast('Filed locally, but the sheet write failed — check the webhook URL');
    });

    return record;
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
          <button className="ghost" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh from sheet'}
          </button>
        </div>
      </div>

      {!WEBHOOK_URL && <SetupNotice missing="webhook" />}
      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: '#8a2f24' }}>{error}</div>}

      <NavCards items={NAV_ITEMS} active={nav} onSelect={setNav} />

      <div className="tab-fade">
        {nav === 'home' && (
          <HomeTab announcements={announcements} birthdays={birthdays} huddles={huddles} townhall={townhall} aprs={aprs} />
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
            {ptoSubTab === 'calendar' && <CalendarTab leads={leads} entries={entries} />}
            {ptoSubTab === 'file' && <FileVLTab leads={leads} filings={filings} onSubmit={submitFiling} />}
          </div>
        )}

        {nav === 'eod' && <EODFormTab leads={leads} />}
        {nav === 'apr' && <APRTab aprs={aprs} />}
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}
