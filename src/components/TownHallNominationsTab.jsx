import { useState } from 'react';
import NominationSubmitTab from './NominationSubmitTab.jsx';
import NominationStatusTab from './NominationStatusTab.jsx';
import NominationSubmissionsTab from './NominationSubmissionsTab.jsx';
import { todayPST, isNominationOpen } from '../lib/dates.js';

export default function TownHallNominationsTab({
  leads,
  nominations,
  isAdmin,
  currentUserName,
  onSubmit,
  onEditNomination,
  nominationOverride,
  onSetNominationOverride,
  showSuccessModal,
}) {
  const [subTab, setSubTab] = useState('submit');
  const windowOpen = isNominationOpen(todayPST(), nominationOverride);

  return (
    <div>
      {isAdmin && (
        <div className="card home-section" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p className="home-section-title" style={{ margin: 0 }}>
              Submissions are {windowOpen ? 'open' : 'closed'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-soft)' }}>
              {nominationOverride === 'open'
                ? 'Reopened by an admin for this month.'
                : nominationOverride === 'closed'
                ? 'Closed by an admin for this month.'
                : 'Following the normal schedule (1st to 16th).'}
            </p>
          </div>
          <button className="primary" onClick={() => onSetNominationOverride(windowOpen ? 'closed' : 'open')}>
            {windowOpen ? 'Turn off' : 'Turn on'}
          </button>
          {nominationOverride && (
            <button
              type="button"
              onClick={() => onSetNominationOverride('')}
              style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            >
              Back to schedule
            </button>
          )}
        </div>
      )}
      <div className="tabnav">
        <button className={`tabbtn ${subTab === 'submit' ? 'active' : ''}`} onClick={() => setSubTab('submit')}>
          Submit
        </button>
        <button className={`tabbtn ${subTab === 'status' ? 'active' : ''}`} onClick={() => setSubTab('status')}>
          Status
        </button>
        <button className={`tabbtn ${subTab === 'submissions' ? 'active' : ''}`} onClick={() => setSubTab('submissions')}>
          Submissions
        </button>
      </div>
      <div key={subTab} className="tab-fade">
        {subTab === 'submit' && (
          <NominationSubmitTab
            leads={leads}
            currentUserName={currentUserName}
            nominations={nominations}
            windowOpen={windowOpen}
            overrideClosed={nominationOverride === 'closed'}
            onSubmit={onSubmit}
            showSuccessModal={showSuccessModal}
          />
        )}
        {subTab === 'status' && <NominationStatusTab leads={leads} nominations={nominations} />}
        {subTab === 'submissions' && (
          <NominationSubmissionsTab
            nominations={nominations}
            currentUserName={currentUserName}
            onEditNomination={onEditNomination}
          />
        )}
      </div>
    </div>
  );
}
