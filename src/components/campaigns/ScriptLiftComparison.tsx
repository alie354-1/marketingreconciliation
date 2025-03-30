import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppSelector } from '../../hooks';
import { selectCurrentCampaign } from '../../store/slices/campaignSlice';

interface ScriptLiftComparisonProps {
  campaignId?: string;
}

export const ScriptLiftComparison: React.FC<ScriptLiftComparisonProps> = ({ campaignId }) => {
  const campaign = useAppSelector(selectCurrentCampaign);
  const effectiveCampaignId = campaignId || campaign?.id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Simple check for table existence to fix the error
    const checkCreativeTemplates = async () => {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('creative_templates')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Error checking creative_templates:', error);
          if (error.code === '42P01') { // Table doesn't exist
            setError('The creative_templates table does not exist in the database.');
          } else {
            setError('Error accessing database tables.');
          }
        }
      } catch (err) {
        console.error('Exception when checking tables:', err);
        setError('An unexpected error occurred when checking database tables.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkCreativeTemplates();
  }, []);
  
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center text-amber-600 mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Error Loading Data</h3>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }
  
  if (!effectiveCampaignId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-primary-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Script Lift Data</h3>
        </div>
        <p className="text-gray-600">Please select a campaign to view prescription data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Script Lift Comparison</h3>
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          The creative templates information is not available. This may affect visualizations that depend on this data.
        </p>
      </div>
      <div className="mt-6">
        <p className="text-gray-700">
          Market share analysis will be available once the necessary data is loaded.
        </p>
      </div>
    </div>
  );
};
