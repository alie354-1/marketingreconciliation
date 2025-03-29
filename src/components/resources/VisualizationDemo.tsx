import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Database, ChevronLeft, AlertCircle } from 'lucide-react';
import { renderEnhancedSegments, renderRegionalHeatMap, convertToAudienceConfig, renderAudienceComparison } from './visualization-enhancers';
import { supabase } from '../../lib/supabase';

// Sample data for demonstration
const SAMPLE_SEGMENTS = [
  {
    id: 'segment-1',
    name: 'Cardiologists',
    specialty: 'Cardiologists',
    count: 1250,
    value: 1250,
    percentage: 35,
    color: '#4f46e5',
    regions: [
      { name: 'Northeast', count: 350 },
      { name: 'Southeast', count: 280 },
      { name: 'Midwest', count: 320 },
      { name: 'Southwest', count: 150 },
      { name: 'West', count: 150 }
    ]
  },
  {
    id: 'segment-2',
    name: 'Neurologists',
    specialty: 'Neurologists',
    count: 950,
    value: 950,
    percentage: 27,
    color: '#7c3aed',
    regions: [
      { name: 'Northeast', count: 270 },
      { name: 'Southeast', count: 180 },
      { name: 'Midwest', count: 220 },
      { name: 'Southwest', count: 100 },
      { name: 'West', count: 180 }
    ]
  },
  {
    id: 'segment-3',
    name: 'Internists',
    specialty: 'Internists',
    count: 1350,
    value: 1350,
    percentage: 38,
    color: '#db2777',
    regions: [
      { name: 'Northeast', count: 380 },
      { name: 'Southeast', count: 320 },
      { name: 'Midwest', count: 300 },
      { name: 'Southwest', count: 150 },
      { name: 'West', count: 200 }
    ]
  }
];

const SAMPLE_REGIONS = [
  { id: 'region-1', name: 'Northeast', providerCount: 1000, percentage: 28 },
  { id: 'region-2', name: 'Southeast', providerCount: 780, percentage: 22 },
  { id: 'region-3', name: 'Midwest', providerCount: 840, percentage: 24 },
  { id: 'region-4', name: 'Southwest', providerCount: 400, percentage: 11 },
  { id: 'region-5', name: 'West', providerCount: 530, percentage: 15 }
];

// Create sample audience configs
const PRIMARY_AUDIENCE = {
  id: 'audience-1',
  name: 'Cardiology Specialists',
  filters: {
    medicationCategory: 'Cardiovascular',
    medications: ['med1', 'med3'],
    excludedMedications: [],
    specialties: ['spec1', 'spec3'],
    regions: ['region-1', 'region-3'],
    prescribingVolume: 'high',
    timeframe: 'last_quarter'
  },
  providerCount: 3550,
  potentialReach: 887500,
  segments: SAMPLE_SEGMENTS,
  regionData: SAMPLE_REGIONS,
  dateCreated: '2025-03-15T12:00:00Z'
};

const SECONDARY_AUDIENCE = {
  id: 'audience-2',
  name: 'General Practitioners',
  filters: {
    medicationCategory: 'Cardiovascular',
    medications: ['med2'],
    excludedMedications: ['med4'],
    specialties: ['spec2', 'spec4'],
    regions: ['region-2', 'region-5'],
    prescribingVolume: 'medium',
    timeframe: 'last_quarter'
  },
  providerCount: 4250,
  potentialReach: 1062500,
  segments: [
    {
      id: 'segment-4',
      name: 'Family Medicine',
      specialty: 'Family Medicine',
      count: 2500,
      value: 2500,
      percentage: 59,
      color: '#10b981',
      regions: [
        { name: 'Northeast', count: 550 },
        { name: 'Southeast', count: 680 },
        { name: 'Midwest', count: 520 },
        { name: 'Southwest', count: 350 },
        { name: 'West', count: 400 }
      ]
    },
    {
      id: 'segment-5',
      name: 'General Practice',
      specialty: 'General Practice',
      count: 1750,
      value: 1750,
      percentage: 41,
      color: '#f59e0b',
      regions: [
        { name: 'Northeast', count: 350 },
        { name: 'Southeast', count: 420 },
        { name: 'Midwest', count: 380 },
        { name: 'Southwest', count: 250 },
        { name: 'West', count: 350 }
      ]
    }
  ],
  regionData: [
    { id: 'region-1', name: 'Northeast', providerCount: 900, percentage: 21 },
    { id: 'region-2', name: 'Southeast', providerCount: 1100, percentage: 26 },
    { id: 'region-3', name: 'Midwest', providerCount: 900, percentage: 21 },
    { id: 'region-4', name: 'Southwest', providerCount: 600, percentage: 14 },
    { id: 'region-5', name: 'West', providerCount: 750, percentage: 18 }
  ],
  dateCreated: '2025-03-20T14:30:00Z'
};

export const VisualizationDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'segments' | 'map' | 'comparison'>('segments');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to test SQL fix for 'Only SELECT queries are allowed' error
  const testDatabaseAccess = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test with a proper SELECT query instead of using the execute_sql RPC
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, specialty')
        .limit(5);
      
      if (error) throw error;
      
      console.log('Database query successful:', data);
      alert(`Database access successful! Found ${data.length} providers.`);
    } catch (err: any) {
      console.error('Database Explorer Error:', err);
      setError(err.message || 'Error accessing database');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Advanced Visualization Demo</h1>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-1">
              It seems there was an SQL execution error. Use the proper query method below instead of 
              the execute_sql RPC function which only allows SELECT queries.
            </p>
          </div>
        </div>
      )}
      
      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveView('segments')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            activeView === 'segments' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Enhanced Segments
        </button>
        <button
          onClick={() => setActiveView('map')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            activeView === 'map' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Regional Heat Map
        </button>
        <button
          onClick={() => setActiveView('comparison')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            activeView === 'comparison' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Audience Comparison
        </button>
      </div>
      
      {/* Demo SQL fix button */}
      <div className="mb-6">
        <Button 
          onClick={testDatabaseAccess}
          disabled={isLoading}
          className="flex items-center"
        >
          <Database className="mr-2 h-4 w-4" />
          {isLoading ? 'Testing Database Access...' : 'Test Database Access (Fixed SQL Query)'}
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          This demonstrates the correct way to query the database, avoiding the "Only SELECT queries are allowed" error
          by using Supabase's query builder instead of the execute_sql RPC function.
        </p>
      </div>
      
      {/* View content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeView === 'segments' && renderEnhancedSegments(SAMPLE_SEGMENTS, 3550)}
        {activeView === 'map' && renderRegionalHeatMap(SAMPLE_REGIONS, 3550)}
        {activeView === 'comparison' && (
          renderAudienceComparison(
            convertToAudienceConfig(PRIMARY_AUDIENCE),
            convertToAudienceConfig(SECONDARY_AUDIENCE),
            () => setActiveView('segments'),
            (audience) => alert(`Would push audience "${audience.name}" to campaign`),
            (audience) => alert(`Would save audience "${audience.name}"`)
          )
        )}
      </div>
    </div>
  );
};
