import { todayPST } from '../lib/dates.js';

export default function APRTab({ aprs }) {
  const todayStr = todayPST();
  const upcoming = aprs
    .filter((a) => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = aprs
    .filter((a) => a.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div>
      <div className="card home-section">
        <p className="home-section-title">Upcoming APRs</p>
        {upcoming.length === 0 ? (
          <p className="empty-note">No upcoming APRs on file.</p>
        ) : (
          upcoming.map((a, i) => (
            <div className="hist-row" key={i}>
              <span className="who">{a.name}</span>
              <span className="hist-when">{a.date}</span>
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
              <span className="hist-when">{a.date}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
