import { useEffect, useState } from 'react';

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export default function ClockBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock-bar">
      <span className="clock-item">
        <span className="clock-label">PST</span> {formatTime(now, 'America/Los_Angeles')}
      </span>
      <span className="clock-item">
        <span className="clock-label">MNL</span> {formatTime(now, 'Asia/Manila')}
      </span>
    </div>
  );
}
