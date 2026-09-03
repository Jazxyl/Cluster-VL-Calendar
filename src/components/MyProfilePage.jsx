import { formatBirthdayDate } from '../lib/dates.js';

function initials(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function MyProfilePage({ lead, email, birthday }) {
  if (!lead) {
    return (
      <div className="card home-section">
        <p className="empty-note">Couldn't find your profile — check that your name matches between the Users and TeamLeads sheets.</p>
      </div>
    );
  }

  return (
    <div className="card profile-card" style={{ maxWidth: 260, padding: 24 }}>
      {lead.photoLink ? (
        <img src={lead.photoLink} alt={lead.name} className="profile-photo" style={{ width: 96, height: 96 }} />
      ) : (
        <div
          className="profile-photo profile-photo-fallback"
          style={{ width: 96, height: 96, fontSize: 28, background: lead.color }}
        >
          {initials(lead.name)}
        </div>
      )}
      <p className="profile-name" style={{ fontSize: 15, marginTop: 8 }}>
        {lead.name}
      </p>
      <p className="profile-line">{email || 'No email on file'}</p>
      <p className="profile-line">{birthday ? formatBirthdayDate(birthday.date) : 'No birthday on file'}</p>
    </div>
  );
}
