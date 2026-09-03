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
  EXPANSION_BONUS_TAB,
  EXPANSION_BONUS_COMPLETIONS_TAB,
  COACHING_COMPLIANCE_TAB,
  SHEET_ID,
  WEBHOOK_URL,
} from './config.js';
import { fetchTabAsObjects } from './lib/csv.js';
import { fetchCalendarMeetings } from './lib/calendarMeetings.js';
import {
  postToSheet,
  filingPayload,
  aprCompletionPayload,
  eowrPayload,
  nominationPayload,
  expansionBonusPayload,
  expansionBonusCompletionPayload,
  coachingCompliancePayload,
  addAgentPayload,
  updateAgentStatusPayload,
} from './lib/webhook.js';
import { evaluateFiling, todayPST, rangesOverlap, parseUSDate } from './lib/dates.js';
import { colorForIndex } from './lib/colors.js';
import NavCards from './components/NavCards.jsx';
import HomeTab from './components/HomeTab.jsx';
import CalendarTab from './components/CalendarTab.jsx';
import FileVLTab from './components/FileVLTab.jsx';
import ReportsTab from './components/ReportsTab.jsx';
import APRTab from './components/APRTab.jsx';
import TownHallNominationsTab from './components/TownHallNominationsTab.jsx';
import CoachingComplianceTab from './components/CoachingComplianceTab.jsx';
import ExpansionBonusTab from './components/ExpansionBonusTab.jsx';
import ProfilesTab from './components/ProfilesTab.jsx';
import MyProfilePage from './components/MyProfilePage.jsx';
import MyRosterPage from './components/MyRosterPage.jsx';
import SetupNotice from './components/SetupNotice.jsx';
import LoginGate from './components/LoginGate.jsx';
import ClockBar from './components/ClockBar.jsx';

const NAV_ITEMS = [
  { key: 'home', title: 'Home', desc: 'Announcements and schedules', icon: 'home' },
  { key: 'pto', title: 'PTO Calendar', desc: 'Leave schedule and coverage', icon: 'calendar' },
  { key: 'reports', title: 'Reports', desc: 'EODr and EOWr submissions', icon: 'form' },
  { key: 'coaching', title: 'Coaching Compliance', desc: 'Log coaching sessions', icon: 'coaching' },
  { key: 'nominations', title: 'Town Hall Nominations', desc: 'Recognize your agents', icon: 'star' },
  { key: 'apr', title: 'APR Notifications', desc: 'Upcoming reviews', icon: 'bell' },
  { key: 'expansionbonus', title: 'Expansion Bonus', desc: 'Track and process bonuses', icon: 'dollar' },
  { key: 'profiles', title: 'Profiles', desc: 'Meet the team', icon: 'profile' },
];

async function safeFetchTab(tabName, expectedHeader) {
  try {
    return await fetchTabAsObjects(csvUrlForTab(tabName), expectedHeader);
  } catch {
    return [];
  }
}

function AppContent({ session, onSignOut }) {
  const isAdmin = (session?.role || '').toLowerCase() === 'admin';
  const currentUserName = session?.name || '';

  const [nav, setNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [userEmails, setUserEmails] = useState({});
  const [expansionBonuses, setExpansionBonuses] = useState([]);
  const [expansionBonusCompletions, setExpansionBonusCompletions] = useState([]);
  const [coachingEntries, setCoachingEntries] = useState([]);

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
          .map((r, i) => ({ id: r.Name.trim(), name: r.Name.trim(), color: colorForIndex(i), photoLink: r.PhotoLink || '' }));
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
            .map((r) => ({
              name: r.Name.trim(),
              date: parseUSDate(r.Date.trim()),
              tl: (r.TL || '').trim(),
              hubstaffId: r['Hubstaff ID'] || '',
              status: (r.Status || 'Active').trim(),
            }))
            .filter((a) => a.date)
            .filter((a) => a.status.toLowerCase() !== 'inactive')
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

        const emailMap = {};
        rows.forEach((r) => {
          if (r.Name && r.Email) emailMap[r.Name.trim().toLowerCase()] = r.Email.trim();
        });
        setUserEmails(emailMap);
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
              recordingLink: r.RecordingLink || '',
            }))
        );
      }),
      safeFetchTab(EXPANSION_BONUS_TAB, 'Timestamp').then((rows) => {
        setExpansionBonuses(
          rows
            .filter((r) => r.TL && r.Timestamp)
            .map((r) => ({
              timestamp: r.Timestamp.trim(),
              tl: r.TL.trim(),
              agent: r.Agent || '',
              client: r.Client || '',
              startDate: r.StartDate || '',
              hubspotLink: r.HubspotLink || '',
            }))
        );
      }),
      safeFetchTab(EXPANSION_BONUS_COMPLETIONS_TAB, 'Timestamp').then((rows) => {
        setExpansionBonusCompletions(
          rows
            .filter((r) => r.OriginalTimestamp)
            .map((r) => ({
              originalTimestamp: r.OriginalTimestamp.trim(),
              processedBy: r.ProcessedBy || '',
              notes: r.Notes || '',
            }))
        );
      }),
      safeFetchTab(COACHING_COMPLIANCE_TAB, 'Timestamp').then((rows) => {
        setCoachingEntries(
          rows
            .filter((r) => r.TL && r.Agent)
            .map((r) => ({
              timestamp: r.Timestamp || '',
              tl: r.TL.trim(),
              agent: r.Agent.trim(),
              type: r.Type || '',
              fathomLink: r.FathomLink || '',
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
  // Now that Users.Name is the full name (matching TeamLeads.Name exactly),
  // no short-to-full resolution is needed anywhere — currentUserName IS the
  // full name already, and every match against it is a direct exact match.
  const reportableLeads = leads.filter((l) => !adminNames.has(l.name.toLowerCase()));

  const currentLead = leads.find((l) => l.name.toLowerCase() === (currentUserName || '').toLowerCase()) || null;
  const currentEmail = userEmails[(currentUserName || '').toLowerCase()] || '';
  const currentBirthday =
    birthdays.find((b) => b.name.toLowerCase().trim() === (currentUserName || '').toLowerCase().trim()) || null;
  const rosterAgentsRaw = aprs.filter(
    (a) => (a.tl || '').toLowerCase().trim() === (currentUserName || '').toLowerCase().trim()
  );
  const rosterAgents = Array.from(
    new Map(rosterAgentsRaw.map((a) => [a.name.toLowerCase().trim(), a])).values()
  );

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

  async function submitNomination({ tl, agent, client, reason, month, recordingLink }) {
    const record = { tl, agent, client, reason, month, recordingLink };
    setNominations((prev) => [record, ...prev]);
    const res = await postToSheet(nominationPayload(record));
    return res;
  }

  async function submitExpansionBonus({ timestamp, tl, agent, client, startDate, hubspotLink }) {
    const record = { timestamp, tl, agent, client, startDate, hubspotLink };
    setExpansionBonuses((prev) => [record, ...prev]);
    const res = await postToSheet(expansionBonusPayload(record));
    return res;
  }

  function processExpansionBonus({ originalTimestamp, notes }) {
    const record = { originalTimestamp, processedBy: currentUserName, notes };
    setExpansionBonusCompletions((prev) => [record, ...prev]);
    postToSheet(expansionBonusCompletionPayload(record)).then((res) => {
      if (!res.ok) toast('Marked locally, but the sheet write failed — check the webhook URL');
    });
  }

  async function submitCoaching({ tl, agent, type, fathomLink }) {
    const record = { tl, agent, type, fathomLink };
    setCoachingEntries((prev) => [record, ...prev]);
    const res = await postToSheet(coachingCompliancePayload(record));
    return res;
  }

  async function submitAddAgent({ name, hubstaffId, date }) {
    const record = { name, date, tl: currentUserName, hubstaffId, status: 'Active' };
    setAprs((prev) => [record, ...prev]);
    const res = await postToSheet(addAgentPayload({ name, tl: currentUserName, hubstaffId, date }));
    return res;
  }

  async function removeAgent({ name, tl, hubstaffId }) {
    // Optimistically drop them from local state immediately — since aprs is
    // filtered to Active-only at the source, this correctly removes them
    // everywhere (Roster, APR Notifications) without touching other logic.
    setAprs((prev) => prev.filter((a) => !(a.name === name && a.tl === tl)));
    const res = await postToSheet(updateAgentStatusPayload({ name, tl, hubstaffId, status: 'Inactive' }));
    return res;
  }

  if (!SHEET_ID) {
    return <SetupNotice missing="sheet" />;
  }

  return (
    <div className="app-shell">
      <NavCards
        items={NAV_ITEMS}
        active={nav}
        onSelect={setNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        session={session}
        currentLead={currentLead}
        onGoToProfile={() => setNav('myprofile')}
        onGoToRoster={() => setNav('myroster')}
        onSignOut={onSignOut}
      />
      <div className="main-area">
        <div className="wrap">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <button className="ghost mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1>
                  {nav === 'myprofile'
                    ? 'Your Profile'
                    : nav === 'myroster'
                    ? 'Your Roster'
                    : NAV_ITEMS.find((n) => n.key === nav)?.title || 'Home'}
                </h1>
                <p className="sub">
                  {nav === 'myprofile'
                    ? 'Your own account details'
                    : nav === 'myroster'
                    ? 'Agents assigned to you'
                    : NAV_ITEMS.find((n) => n.key === nav)?.desc || 'Your cluster, all in one place'}
                </p>
              </div>
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
            currentUserFullName={currentUserName}
            expansionBonuses={expansionBonuses}
            expansionBonusCompletions={expansionBonusCompletions}
            onGoToExpansionBonus={() => setNav('expansionbonus')}
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
                  currentUserName={currentUserName}
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
            currentUserName={currentUserName}
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
            currentUserName={currentUserName}
            onSubmit={submitNomination}
          />
        )}
        {nav === 'coaching' && (
          <CoachingComplianceTab
            leads={leads}
            entries={coachingEntries}
            isAdmin={isAdmin}
            currentUserName={currentUserName}
            onSubmit={submitCoaching}
          />
        )}
        {nav === 'expansionbonus' && (
          <ExpansionBonusTab
            leads={leads}
            entries={expansionBonuses}
            completions={expansionBonusCompletions}
            isAdmin={isAdmin}
            currentUserName={currentUserName}
            onSubmit={submitExpansionBonus}
            onProcess={processExpansionBonus}
          />
        )}
        {nav === 'profiles' && <ProfilesTab leads={leads} userEmails={userEmails} birthdays={birthdays} />}
        {nav === 'myprofile' && (
          <MyProfilePage lead={currentLead} email={currentEmail} birthday={currentBirthday} />
        )}
        {nav === 'myroster' && (
          <MyRosterPage agents={rosterAgents} onAddAgent={submitAddAgent} onRemoveAgent={removeAgent} />
        )}
          </div>

          <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <LoginGate>{(session, onSignOut) => <AppContent session={session} onSignOut={onSignOut} />}</LoginGate>;
}
