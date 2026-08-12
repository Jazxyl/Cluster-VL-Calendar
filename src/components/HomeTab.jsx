import { todayPST, formatUSDate, isAprRelevant, daysFromAprDue } from '../lib/dates.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function firstName(fullName) {
  return (fullName || '').trim().split(' ')[0];
}

function formatBirthdayDate(mmdd) {
  const [mm, dd] = mmdd.split('-');
  const monthIdx = Number(mm) - 1;
  return `${MONTH_NAMES[monthIdx] || mm} ${Number(dd)}`;
}

export default function HomeTab({ announcements, birthdays, huddles, townhall, aprs, isAdmin, currentUserName }) {
  const todayStr = todayPST();
  const currentMonth = todayStr.split('-')[1];

  const visibleAprs = isAdmin
    ? aprs
    : aprs.filter((a) => (a.tl || '').toLowerCase().trim() === (currentUserName || '').toLowerCase().trim());

  const relevantAprs = visibleAprs
    .filter((a) => isAprRelevant(a.date, todayStr))
    .sort((a, b) => daysFromAprDue(a.date, todayStr) - daysFromAprDue(b.date, todayStr));
  const upcomingAprs = relevantAprs.slice(0, 5);
  const moreAprsCount = relevantAprs.length - upcomingAprs.length;

  const birthdaysThisMonth = birthdays
    .filter((b) => b.date.split('-')[0] === currentMonth)
    .sort((a, b) => Number(a.date.split('-')[1]) - Number(b.date.split('-')[1]));

  return (
    <div>
      {relevantAprs.length > 0 && (
        <div className="home-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EFF7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 0 0-5-5z" />
            <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
          </svg>
          <div>
            <p className="home-banner-title">
              {relevantAprs.length} upcoming APR{relevantAprs.length === 1 ? '' : 's'}
            </p>
            <p className="home-banner-sub">
              {upcomingAprs.map((a) => `${firstName(a.name)} · ${formatUSDate(a.date)}`).join('  ·  ')}
              {moreAprsCount > 0 ? `  ·  +${moreAprsCount} more` : ''}
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
            <p className="home-section-title">Cluster huddle</p>
            {huddles.length === 0 ? (
              <p className="empty-note">Nothing scheduled yet.</p>
            ) : (
              huddles.map((h, i) => (
                <p key={i} className="home-line">
                  {i === 0 ? 'Next: ' : 'Then: '}
                  {h.date} · {h.time}
                </p>
              ))
            )}
          </div>
          <div className="card home-section">
            <p className="home-section-title">Townhall</p>
            {townhall ? (
              <p className="home-line">
                Next: {townhall.date} · {townhall.time}
              </p>
            ) : (
              <p className="empty-note">Nothing scheduled yet.</p>
            )}
          </div>
        </div>

        <div className="card home-section">
          <p className="home-section-title">Birthdays this month</p>
          {birthdaysThisMonth.length === 0 ? (
            <p className="empty-note">No birthdays this month.</p>
          ) : (
            birthdaysThisMonth.map((b, i) => (
              <p key={i} className="home-line">
                {firstName(b.name)} — {formatBirthdayDate(b.date)}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
