import { useState } from 'react';
import CoachingComplianceSubmitTab from './CoachingComplianceSubmitTab.jsx';
import CoachingComplianceStatusTab from './CoachingComplianceStatusTab.jsx';

export default function CoachingComplianceTab({ leads, entries, isAdmin, currentUserName, onSubmit }) {
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
          <CoachingComplianceSubmitTab leads={leads} currentUserName={currentUserName} onSubmit={onSubmit} />
        )}
        {subTab === 'status' && (
          <CoachingComplianceStatusTab entries={entries} isAdmin={isAdmin} currentUserName={currentUserName} />
        )}
      </div>
    </div>
  );
}
