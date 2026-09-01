import { useState } from 'react';
import { formatBirthdayDate } from '../lib/dates.js';

function initials(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function ProfileCard({ lead, email, birthday }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = lead.photoLink && !imgFailed;

  return (
    <div className="card profile-card">
      {showPhoto ? (
        <img
          src={lead.photoLink}
          alt={lead.name}
          className="profile-photo"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="profile-photo profile-photo-fallback" style={{ background: lead.color }}>
          {initials(lead.name)}
        </div>
      )}
      <p className="profile-name">{lead.name}</p>
      <p className="profile-line">{email || 'No email on file'}</p>
      <p className="profile-line">{birthday ? formatBirthdayDate(birthday.date) : 'No birthday on file'}</p>
    </div>
  );
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
        return <ProfileCard key={l.id} lead={l} email={email} birthday={birthday} />;
      })}
    </div>
  );
}
