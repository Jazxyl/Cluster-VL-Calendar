import { formatBirthdayDate } from '../lib/dates.js';

function initials(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function ProfilesTab({ leads, userEmails, birthdays }) {
  if (leads.length === 0) {
    return (
      <div className="card home-section">
        <p className="empty-note">No team leads on file yet.</p>
      </div>
    );
  }

  return (
    <div className="profiles-grid">
      {leads.map((l) => {
        const firstNameKey = l.name.trim().split(' ')[0].toLowerCase();
        const email = userEmails?.[firstNameKey] || '';
        const birthday = birthdays.find((b) => b.name.toLowerCase().trim() === l.name.toLowerCase().trim());

        return (
          <div className="card profile-card" key={l.id}>
            {l.photoLink ? (
              <img src={l.photoLink} alt={l.name} className="profile-photo" />
            ) : (
              <div className="profile-photo profile-photo-fallback" style={{ background: l.color }}>
                {initials(l.name)}
              </div>
            )}
            <p className="profile-name">{l.name}</p>
            <p className="profile-line">{email || 'No email on file'}</p>
            <p className="profile-line">{birthday ? formatBirthdayDate(birthday.date) : 'No birthday on file'}</p>
          </div>
        );
      })}
    </div>
  );
}
