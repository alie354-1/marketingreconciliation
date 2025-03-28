import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CampaignCreator } from './components/CampaignCreator.tsx';
import { CampaignList } from './components/CampaignList.tsx';
import { CampaignResults } from './components/CampaignResults.tsx';
import { Auth } from './components/Auth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<CampaignList />} />
          <Route path="create" element={<CampaignCreator />} />
          <Route path="results/:id" element={<CampaignResults />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
