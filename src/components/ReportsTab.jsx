import { useState } from 'react';
import EODFormTab from './EODFormTab.jsx';
import EODrStatusTab from './EODrStatusTab.jsx';
import EOWrSubmitTab from './EOWrSubmitTab.jsx';
import EOWrStatusTab from './EOWrStatusTab.jsx';
import AdminTrackerTab from './AdminTrackerTab.jsx';

export default function ReportsTab({ leads, eodEntries, eowrEntries, isAdmin, currentUserName, onSubmitEowr, showSuccessModal, toast }) {
  const [reportTab, setReportTab] = useState('eodr');
  const [eodrSubTab, setEodrSubTab] = useState('submit');
  const [eowrSubTab, setEowrSubTab] = useState('submit');

  return (
    <div>
      <div className="folder-tabs">
        <button className={`folder-tab ${reportTab === 'eodr' ? 'active' : ''}`} onClick={() => setReportTab('eodr')}>EODr</button>
        <button className={`folder-tab ${reportTab === 'eowr' ? 'active' : ''}`} onClick={() => setReportTab('eowr')}>EOWr</button>
        {isAdmin && <button className={`folder-tab ${reportTab === 'admin' ? 'active' : ''}`} onClick={() => setReportTab('admin')}>Admin</button>}
      </div>
      <div className="folder-panel">
        {reportTab === 'eodr' && (
          <div>
            <div className="tabnav">
              <button className={`tabbtn ${eodrSubTab === 'submit' ? 'active' : ''}`} onClick={() => setEodrSubTab('submit')}>Submit</button>
              <button className={`tabbtn ${eodrSubTab === 'status' ? 'active' : ''}`} onClick={() => setEodrSubTab('status')}>Status</button>
            </div>
            <div key={eodrSubTab} className="tab-fade">
              {eodrSubTab === 'submit' && (
                <EODFormTab leads={leads} currentUserName={currentUserName} showSuccessModal={showSuccessModal} toast={toast} />
              )}
              {eodrSubTab === 'status' && <EODrStatusTab leads={leads} eodEntries={eodEntries} />}
            </div>
          </div>
        )}
        {reportTab === 'eowr' && (
          <div>
            <div className="tabnav">
              <button className={`tabbtn ${eowrSubTab === 'submit' ? 'active' : ''}`} onClick={() => setEowrSubTab('submit')}>Submit</button>
              <button className={`tabbtn ${eowrSubTab === 'status' ? 'active' : ''}`} onClick={() => setEowrSubTab('status')}>Status</button>
            </div>
            <div key={eowrSubTab} className="tab-fade">
              {eowrSubTab === 'submit' && (
                <EOWrSubmitTab leads={leads} currentUserName={currentUserName} onSubmit={onSubmitEowr} showSuccessModal={showSuccessModal} />
              )}
              {eowrSubTab === 'status' && <EOWrStatusTab leads={leads} eowrEntries={eowrEntries} />}
            </div>
          </div>
        )}
        {reportTab === 'admin' && isAdmin && <AdminTrackerTab leads={leads} eodEntries={eodEntries} eowrEntries={eowrEntries} />}
      </div>
    </div>
  );
}
