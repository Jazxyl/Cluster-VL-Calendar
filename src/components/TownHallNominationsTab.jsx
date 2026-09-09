import { useState } from 'react';
import NominationSubmitTab from './NominationSubmitTab.jsx';
import NominationStatusTab from './NominationStatusTab.jsx';
import NominationSubmissionsTab from './NominationSubmissionsTab.jsx';

export default function TownHallNominationsTab({
  leads,
  nominations,
  isAdmin,
  currentUserName,
  onSubmit,
  onEditNomination,
  showSuccessModal,
}) {
  const [subTab, setSubTab] = useState('submit');

  return (
    <div>
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
