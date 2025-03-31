import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { CampaignCreator } from './components/campaigns/CampaignCreator';
import { CampaignList } from './components/campaigns/CampaignList';
import { CampaignResults } from './components/campaigns/CampaignResults';
import { AudienceExplorer } from './components/audience/AudienceExplorer';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/new" element={<CampaignCreator />} />
          <Route path="/campaigns/create" element={<CampaignCreator />} />
          <Route path="/campaigns/:id" element={<CampaignResults />} />
          <Route path="/campaigns/:id/results" element={<CampaignResults />} />
          <Route path="/audience-explorer" element={<AudienceExplorer />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
