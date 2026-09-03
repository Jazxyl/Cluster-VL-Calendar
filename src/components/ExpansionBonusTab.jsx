import { useState } from 'react';
import ExpansionBonusSubmitTab from './ExpansionBonusSubmitTab.jsx';
import ExpansionBonusStatusTab from './ExpansionBonusStatusTab.jsx';

export default function ExpansionBonusTab({ leads, entries, completions, isAdmin, currentUserName, onSubmit, onProcess, showSuccessModal }) {
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
          <ExpansionBonusSubmitTab
            leads={leads}
            currentUserName={currentUserName}
            onSubmit={onSubmit}
            showSuccessModal={showSuccessModal}
          />
        )}
        {subTab === 'status' && (
          <ExpansionBonusStatusTab
            entries={entries}
            completions={completions}
            isAdmin={isAdmin}
            currentUserName={currentUserName}
            onProcess={onProcess}
          />
        )}
      </div>
    </div>
  );
}
