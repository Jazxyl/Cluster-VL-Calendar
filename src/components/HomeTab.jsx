import { daysUntilBirthday, todayPST } from '../lib/dates.js';

function firstName(fullName) {
  return (fullName || '').trim().split(' ')[0];
}

export default function HomeTab({ announcements, birthdays, meetings, aprs }) {
  const todayStr = todayPST();

  const upcomingAprs = aprs
    .filter((a) => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const upcomingBirthdays = birthdays
    .map((b) => ({ ...b, daysAway: daysUntilBirthday(b.date, todayStr) }))
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 6);

  const clusterMeeting = meetings
    .filter((m) => m.type.toLowerCase() === 'cluster' && m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const townhall = meetings
    .filter((m) => m.type.toLowerCase() === 'townhall' && m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div>
      {upcomingAprs.length > 0 && (
        <div className="home-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EFF7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 0 0-5-5z" />
            <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
          </svg>
          <div>
            <p className="home-banner-title">
              {upcomingAprs.length} upcoming APR{upcomingAprs.length === 1 ? '' : 's'}
            </p>
            <p className="home-banner-sub">
              {upcomingAprs.map((a) => `${firstName(a.name)} · ${a.date}`).join('  ·  ')}
            </p>
          </div>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="card home-section">
          <p className="home-section-title">Announcements</p>
          {announcements.map((a, i) => (
            <p key={i} className="home-line">
              {a.message}
            </p>
          ))}
        </div>
      )}

      <div className="home-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card home-section">
            <p className="home-section-title">Cluster meeting</p>
            {clusterMeeting ? (
              <p className="home-line">
                Next: {clusterMeeting.date}
                {clusterMeeting.time ? ` · ${clusterMeeting.time}` : ''}
                {clusterMeeting.note ? ` · ${clusterMeeting.note}` : ''}
              </p>
            ) : (
              <p className="empty-note">Nothing scheduled yet.</p>
            )}
          </div>
          <div className="card home-section">
            <p className="home-section-title">Townhall</p>
            {townhall ? (
              <p className="home-line">
                Next: {townhall.date}
                {townhall.time ? ` · ${townhall.time}` : ''}
                {townhall.note ? ` · ${townhall.note}` : ''}
              </p>
            ) : (
              <p className="empty-note">Nothing scheduled yet.</p>
            )}
          </div>
        </div>

        <div className="card home-section">
          <p className="home-section-title">Birthdays</p>
          {upcomingBirthdays.length === 0 ? (
            <p className="empty-note">No birthdays on file.</p>
          ) : (
            upcomingBirthdays.map((b, i) => (
              <p key={i} className="home-line">
                {firstName(b.name)} — {b.date}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
