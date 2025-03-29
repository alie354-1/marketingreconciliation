import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// Layout and Auth components
import { MainLayout } from './components/layout/MainLayout';
import { Auth } from './components/auth/Auth'; 

// Main feature components
import { Dashboard } from './components/dashboard/Dashboard';

// Campaign components
import { CampaignList } from './components/campaigns/CampaignList';
import { CampaignCreator } from './components/campaigns/CampaignCreator';
import { CampaignResults } from './components/campaigns/CampaignResults';
import { ScriptLiftConfigurator } from './components/campaigns/ScriptLiftConfigurator';

// Analytics components
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';

// Resource components
import { ConditionsList } from './components/resources/ConditionsList';
import { MedicationsList } from './components/resources/MedicationsList';
import { RegionsList } from './components/resources/RegionsList';
// Database and Settings components
import { ExploreDatabase } from './components/resources/ExploreDatabase';
import { VisualizationDemo } from './components/resources/VisualizationDemo';
import { Settings } from './components/settings/Settings';

// Types
import type { ReactNode, FC } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { getCurrentUser } from './store/slices/authSlice';
import { fetchAllReferenceData } from './store/slices/referenceDataSlice';

function App() {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => {
    const auth = state.auth as { user: any; isLoading: boolean };
    return auth;
  });

  useEffect(() => {
    // Check if user is authenticated
    dispatch(getCurrentUser());
    
    // Load reference data
    dispatch(fetchAllReferenceData());
  }, [dispatch]);

  // Require authentication for protected routes
  // Make RequireAuth a named function component with explicit types
  const RequireAuth: FC<{ children: ReactNode }> = ({ children }) => {
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>;
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Auth />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          
          {/* Campaign routes */}
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="campaigns/create" element={<CampaignCreator />} />
          <Route path="campaigns/:id" element={<CampaignResults />} />
          <Route path="campaigns/:id/script-lift" element={<ScriptLiftConfigurator />} />
          
          {/* Analytics routes */}
          <Route path="analytics" element={<AnalyticsDashboard />} />
          
          {/* Resource routes */}
          <Route path="database" element={<ExploreDatabase />} />
          <Route path="conditions" element={<ConditionsList />} />
          <Route path="medications" element={<MedicationsList />} />
          <Route path="regions" element={<RegionsList />} />
          
          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
