import { useState } from 'react';
import { formatBirthdayDate } from '../lib/dates.js';

const ICONS = {
  home: (
    <path d="M4 12l8-8 8 8M6 10v10h5v-6h2v6h5V10" />
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  form: (
    <>
      <path d="M14 3v5h5" />
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  bell: (
    <>
      <path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 0 0-5-5z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </>
  ),
  star: (
    <path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z" />
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2v20" />
      <path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.4-5 3.5c0 2.3 2.2 3 5 3.5s5 1.2 5 3.5c0 2.1-2.2 3.5-5 3.5s-5-1.6-5-3.5" />
    </>
  ),
  coaching: (
    <>
      <path d="M4 4h16v12H8l-4 4V4z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
};

function NavIcon({ name, color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

function initials(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function UserMenu({ session, currentLead, currentEmail, currentBirthday, rosterAgents, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null); // null | 'profile' | 'roster'
  const [imgFailed, setImgFailed] = useState(false);

  const displayName = currentLead?.name || session?.name || 'Account';
  const showPhoto = currentLead?.photoLink && !imgFailed;

  function toggleMenu() {
    setOpen((o) => {
      if (o) setView(null);
      return !o;
    });
  }

  return (
    <div className="sidebar-usermenu">
      {open && (
        <div className="sidebar-user-panel">
          {view === null && (
            <>
              <button className="sidebar-user-option" onClick={() => setView('profile')}>
                Profile
              </button>
              <button className="sidebar-user-option" onClick={() => setView('roster')}>
                Roster
              </button>
              <button className="sidebar-user-option sidebar-user-option-danger" onClick={onSignOut}>
                Sign out
              </button>
            </>
          )}
          {view === 'profile' && (
            <div>
              <button className="sidebar-user-back" onClick={() => setView(null)}>
                ← Back
              </button>
              <div className="sidebar-user-detail">
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--navy)' }}>{displayName}</p>
                <p style={{ margin: '0 0 2px' }}>{currentEmail || 'No email on file'}</p>
                <p style={{ margin: 0 }}>
                  {currentBirthday ? formatBirthdayDate(currentBirthday.date) : 'No birthday on file'}
                </p>
              </div>
            </div>
          )}
          {view === 'roster' && (
            <div>
              <button className="sidebar-user-back" onClick={() => setView(null)}>
                ← Back
              </button>
              <div className="sidebar-user-detail">
                {rosterAgents.length === 0 ? (
                  <p style={{ margin: 0 }}>No agents on file.</p>
                ) : (
                  rosterAgents.map((name, i) => (
                    <p key={i} style={{ margin: '0 0 2px' }}>
                      {name}
                    </p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <button className="sidebar-user-trigger" onClick={toggleMenu}>
        {showPhoto ? (
          <img
            src={currentLead.photoLink}
            alt={displayName}
            className="sidebar-user-avatar"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="sidebar-user-avatar sidebar-user-avatar-fallback"
            style={{ background: currentLead?.color || '#69C920' }}
          >
            {initials(displayName)}
          </div>
        )}
        <span className="sidebar-user-name">{displayName}</span>
      </button>
    </div>
  );
}

export default function NavCards({
  items,
  active,
  onSelect,
  isOpen,
  onClose,
  session,
  currentLead,
  currentEmail,
  currentBirthday,
  rosterAgents,
  onSignOut,
}) {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <p className="sidebar-brand">Cluster Joe</p>
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
              onClick={() => {
                onSelect(item.key);
                onClose();
              }}
            >
              <NavIcon name={item.icon} color={isActive ? '#6EFF7B' : 'rgba(255,255,255,0.55)'} />
              <span>{item.title}</span>
            </button>
          );
        })}

        <UserMenu
          session={session}
          currentLead={currentLead}
          currentEmail={currentEmail}
          currentBirthday={currentBirthday}
          rosterAgents={rosterAgents || []}
          onSignOut={onSignOut}
        />
      </div>
    </>
  );
}
