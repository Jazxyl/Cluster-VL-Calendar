import { useState } from 'react';
import NominationSubmitTab from './NominationSubmitTab.jsx';
import NominationStatusTab from './NominationStatusTab.jsx';

export default function TownHallNominationsTab({ leads, nominations, isAdmin, currentUserName, onSubmit, showSuccessModal }) {
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
      </div>
    </div>
  );
}
