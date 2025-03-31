import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCampaignById, fetchCampaignResults, selectCurrentCampaign, selectCampaignResults } from '../../store/slices/campaignSlice';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  ArrowLeft, 
  Clock, 
  Globe, 
  Activity, 
  Microscope, 
  HeartPulse,
  DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ScriptLiftComparison } from './ScriptLiftComparison';
import { ScriptLiftBaseSelector } from './ScriptLiftBaseSelector';
import { getSampleCampaignById, SampleCampaign } from '../../lib/sampleCampaignData';
import { Campaign } from '../../types';

// Helper type for campaign data
type CombinedCampaignType = {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  created_by?: string;
  target_specialty?: string;
  target_geographic_area?: string;
};

export function CampaignResults() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [campaignData, setCampaignData] = useState<CombinedCampaignType | null>(null);
  
  // Get campaign and results with memoized selectors
  const dbCampaign = useAppSelector(selectCurrentCampaign);
  const results = useAppSelector(selectCampaignResults);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // Check if this is a sample campaign (sample campaign IDs start with 'camp-')
      if (id.startsWith('camp-')) {
        // Get sample campaign data
        const sampleCampaign = getSampleCampaignById(id);
        if (sampleCampaign) {
          setCampaignData({
            id: sampleCampaign.id,
            name: sampleCampaign.name,
            description: sampleCampaign.description,
            status: sampleCampaign.status,
            target_specialty: sampleCampaign.target.specialty,
            target_geographic_area: sampleCampaign.target.geographic,
            start_date: sampleCampaign.startDate,
            end_date: sampleCampaign.endDate,
            created_at: sampleCampaign.created_at,
            created_by: 'sample-user'
          });
          setLoading(false);
        } else {
          setCampaignData(null);
          setLoading(false);
        }
      } else {
        // Fetch from database for real campaigns
        try {
          await dispatch(fetchCampaignById(id));
          await dispatch(fetchCampaignResults(id));
          setLoading(false);
        } catch (error) {
          console.error('Error fetching campaign data:', error);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id, dispatch]);

  // Use either the sample campaign data or the database campaign data
  const campaign = campaignData || dbCampaign;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found</p>
        <Link to="/campaigns" className="mt-4 text-primary-500 hover:underline">
          Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-4">
        <Link
          to="/campaigns"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Campaigns
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-t-lg p-8 text-white mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-white mr-3" />
              <div>
                <h2 className="text-3xl font-bold">{campaign.name || 'Campaign Details'}</h2>
                <p className="text-primary-100 mt-1">
                  {campaign.target_specialty || 'All Specialties'} • {campaign.target_geographic_area || 'All Regions'}
                </p>
              </div>
            </div>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
              campaign.status === 'active' ? 'bg-green-400 text-white' :
              campaign.status === 'in_progress' ? 'bg-blue-400 text-white' :
              campaign.status === 'scheduled' ? 'bg-yellow-400 text-white' :
              campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              campaign.status === 'completed' ? 'bg-purple-400 text-white' :
              'bg-yellow-400 text-white'
            )}>
              {campaign.status === 'in_progress' ? 'In Progress' : campaign.status || 'Draft'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('overview')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                selectedTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Overview
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('prescriptions')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                selectedTab === 'prescriptions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span className="flex items-center">
                <HeartPulse className="h-4 w-4 mr-1.5" />
                Prescription Impact
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('adperformance')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                selectedTab === 'adperformance'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span className="flex items-center">
                <Activity className="h-4 w-4 mr-1.5" />
                Ad Performance
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Campaign Name</dt>
                  <dd className="text-sm font-semibold text-gray-900">{campaign.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm font-semibold text-gray-900">{campaign.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Target Specialty</dt>
                  <dd className="text-sm font-semibold text-gray-900">{campaign.target_specialty || 'All Specialties'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Geographic Area</dt>
                  <dd className="text-sm font-semibold text-gray-900">{campaign.target_geographic_area || 'All Regions'}</dd>
                </div>
                {campaign.start_date && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="text-sm font-semibold text-gray-900">{new Date(campaign.start_date).toLocaleDateString()}</dd>
                  </div>
                )}
                {campaign.end_date && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="text-sm font-semibold text-gray-900">{new Date(campaign.end_date).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {campaignData && campaignData.description && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700">{campaignData.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
