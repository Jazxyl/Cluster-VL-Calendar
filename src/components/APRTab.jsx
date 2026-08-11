import { todayPST, formatUSDate } from '../lib/dates.js';

export default function APRTab({ aprs, isAdmin, currentUserName }) {
  const todayStr = todayPST();

  if (isAdmin) {
    const upcoming = aprs.filter((a) => a.date >= todayStr);
    const byTl = {};
    upcoming.forEach((a) => {
      const tl = a.tl || 'Unassigned';
      byTl[tl] = (byTl[tl] || 0) + 1;
    });
    const tlList = Object.entries(byTl).sort((a, b) => a[0].localeCompare(b[0]));

    return (
      <div className="card home-section">
        <p className="home-section-title">Upcoming APRs by team lead</p>
        {tlList.length === 0 ? (
          <p className="empty-note">No upcoming APRs on file.</p>
        ) : (
          tlList.map(([tl, count]) => (
            <div className="hist-row" key={tl}>
              <span className="who">{tl}</span>
              <span className="hist-when">
                {count} upcoming
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  const mine = aprs.filter(
    (a) => (a.tl || '').toLowerCase().trim() === (currentUserName || '').toLowerCase().trim()
  );
  const upcoming = mine.filter((a) => a.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const past = mine
    .filter((a) => a.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div>
      <div className="card home-section">
        <p className="home-section-title">Upcoming APRs</p>
        {upcoming.length === 0 ? (
          <p className="empty-note">No upcoming APRs for your agents.</p>
        ) : (
          upcoming.map((a, i) => (
            <div className="hist-row" key={i}>
              <span className="who">{a.name}</span>
              <span className="hist-when">{formatUSDate(a.date)}</span>
            </div>
          ))
        )}
      </div>

      <div className="card home-section" style={{ marginTop: 16 }}>
        <p className="home-section-title">Recently passed</p>
        {past.length === 0 ? (
          <p className="empty-note">Nothing yet.</p>
        ) : (
          past.map((a, i) => (
            <div className="hist-row" key={i}>
              <span className="who">{a.name}</span>
              <span className="hist-when">{formatUSDate(a.date)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
