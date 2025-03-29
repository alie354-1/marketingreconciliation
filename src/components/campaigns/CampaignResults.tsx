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
  Brain, 
  Microscope, 
  HeartPulse,
  DollarSign,
  CreditCard,
  PieChart,
  Calculator
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { ScriptLiftComparison } from './ScriptLiftComparison';

// Sample data for charts
const DUMMY_HISTORICAL_DATA = [
  { report_date: '2024-10-01', metrics: { impressions: 5000, clicks: 250, conversions: 20 }, engagement_metrics: { avg_time_on_page: 45 }, roi_metrics: { roi_percentage: 120, estimated_revenue_impact: 15000 }, prescription_metrics: { new_prescriptions: 35, prescription_renewals: 80, market_share_change: 1.2 } },
  { report_date: '2024-11-01', metrics: { impressions: 6200, clicks: 310, conversions: 28 }, engagement_metrics: { avg_time_on_page: 52 }, roi_metrics: { roi_percentage: 135, estimated_revenue_impact: 18000 }, prescription_metrics: { new_prescriptions: 48, prescription_renewals: 95, market_share_change: 1.5 } },
  { report_date: '2024-12-01', metrics: { impressions: 7800, clicks: 390, conversions: 35 }, engagement_metrics: { avg_time_on_page: 58 }, roi_metrics: { roi_percentage: 142, estimated_revenue_impact: 22000 }, prescription_metrics: { new_prescriptions: 65, prescription_renewals: 110, market_share_change: 1.8 } },
  { report_date: '2025-01-01', metrics: { impressions: 8500, clicks: 425, conversions: 40 }, engagement_metrics: { avg_time_on_page: 61 }, roi_metrics: { roi_percentage: 151, estimated_revenue_impact: 25000 }, prescription_metrics: { new_prescriptions: 72, prescription_renewals: 125, market_share_change: 2.2 } },
  { report_date: '2025-02-01', metrics: { impressions: 9200, clicks: 460, conversions: 46 }, engagement_metrics: { avg_time_on_page: 65 }, roi_metrics: { roi_percentage: 158, estimated_revenue_impact: 28000 }, prescription_metrics: { new_prescriptions: 85, prescription_renewals: 140, market_share_change: 2.5 } },
  { report_date: '2025-03-01', metrics: { impressions: 10000, clicks: 500, conversions: 50 }, engagement_metrics: { avg_time_on_page: 68 }, roi_metrics: { roi_percentage: 165, estimated_revenue_impact: 30000 }, prescription_metrics: { new_prescriptions: 95, prescription_renewals: 155, market_share_change: 3.0 } },
];

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive = true, icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="bg-primary-50 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className={cn(
          "flex items-center text-sm font-medium",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? '+' : '-'}{change}
        </div>
      </div>
    </div>
  );
};

export function CampaignResults() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Get campaign and results with memoized selectors
  const campaign = useAppSelector(selectCurrentCampaign);
  const results = useAppSelector(selectCampaignResults);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        await dispatch(fetchCampaignById(id));
        await dispatch(fetchCampaignResults(id));
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, dispatch]);

  // Generate mock data for empty states
  const result = results.length > 0 ? results[0] : {
    metrics: {
      impressions: 10483,
      clicks: 524,
      conversions: 52
    },
    engagement_metrics: {
      avg_time_on_page: 68,
      bounce_rate: 32,
      return_visits: 82,
      resource_downloads: 38
    },
    demographic_metrics: {
      age_groups: { "25-34": 15, "35-44": 25, "45-54": 35, "55-64": 20, "65+": 5 },
      genders: { "Male": 65, "Female": 35 }
    },
    roi_metrics: {
      total_campaign_cost: 15000,
      roi_percentage: 165,
      estimated_revenue_impact: 30000,
      cost_per_click: 28.63,
      cost_per_conversion: 288.46,
      cost_per_impression: 1.43,
      lifetime_value_impact: 125000
    },
    prescription_metrics: {
      new_prescriptions: 95,
      prescription_renewals: 155,
      market_share_change: 3.0,
      patient_adherence_rate: 68,
      total_prescription_change: 18.3,
      prescription_by_region: { "Northeast": 32, "Southeast": 25, "Midwest": 18, "Southwest": 12, "West": 13 },
      prescription_by_specialty: { "Primary Care": 45, "Cardiology": 15, "Neurology": 12, "Endocrinology": 18, "Other": 10 }
    },
    report_date: new Date().toISOString()
  };

  // Use historical data for charts
  const historicalData = DUMMY_HISTORICAL_DATA;

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

  // Type-safe data accessor for charts
  const getDataValue = (entry: any, path: string): number => {
    if (!entry || typeof entry !== 'object') return 0;
    
    const parts = path.split('.');
    let value: any = entry;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return 0;
      }
    }
    
    return typeof value === 'number' ? value : 0;
  };

  // Type-safe function for chart data keys that returns proper number values
  type ChartDataEntry = any;
  const createDataKeyFn = (path: string) => {
    return (entry: ChartDataEntry): number => getDataValue(entry, path);
  };

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
          
          <Link
            to={`/campaigns/${id}/script-lift`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Script Lift Configurator
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
              campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-400 text-white'
            )}>
              {campaign.status || 'Draft'}
            </span>
          </div>

          {/* Key metrics */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 ring-2 ring-white/30">
                <div className="flex items-center text-primary-50 mb-2">
                  <HeartPulse className="h-5 w-5 mr-2" />
                  <span>Script Lift</span>
                </div>
                <p className="text-4xl font-bold">
                  {String(result.prescription_metrics.total_prescription_change)}%
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center text-primary-50 mb-2">
                  <Activity className="h-5 w-5 mr-2" />
                  <span>Click-Through Rate</span>
                </div>
                <p className="text-4xl font-bold">
                  {((result.metrics.clicks / result.metrics.impressions) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center text-primary-50 mb-2">
                  <DollarSign className="h-5 w-5 mr-2" />
                  <span>Cost Per Click</span>
                </div>
                <p className="text-4xl font-bold">
                  ${result.roi_metrics.cost_per_click.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center text-primary-50 mb-2">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  <span>ROI</span>
                </div>
                <p className="text-4xl font-bold">
                  {String(result.roi_metrics.roi_percentage)}%
                </p>
              </div>
            </div>
          )}
        </div>

          {/* Provider Filter Controls */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm font-medium text-gray-700">Filter by:</div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Select
                label="Specialty"
                options={[
                  { value: 'all', label: 'All Specialties' },
                  { value: 'primary', label: 'Primary Care' },
                  { value: 'cardiology', label: 'Cardiology' },
                  { value: 'neurology', label: 'Neurology' },
                  { value: 'endocrinology', label: 'Endocrinology' },
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Select
                label="Region"
                options={[
                  { value: 'all', label: 'All Regions' },
                  { value: 'northeast', label: 'Northeast' },
                  { value: 'southeast', label: 'Southeast' },
                  { value: 'midwest', label: 'Midwest' },
                  { value: 'west', label: 'West' },
                  { value: 'southwest', label: 'Southwest' },
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Select
                label="Prescribing Volume"
                options={[
                  { value: 'all', label: 'All Volumes' },
                  { value: 'high', label: 'High Volume' },
                  { value: 'medium', label: 'Medium Volume' },
                  { value: 'low', label: 'Low Volume' },
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
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
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-8">
              {/* Campaign Performance Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Impressions"
                    value={result.metrics.impressions.toLocaleString()}
                    change="12.5%"
                    isPositive={true}
                    icon={<Users className="h-5 w-5 text-primary-500" />}
                  />
                  <MetricCard
                    title="Clicks"
                    value={result.metrics.clicks.toLocaleString()}
                    change="8.3%"
                    isPositive={true}
                    icon={<Activity className="h-5 w-5 text-primary-500" />}
                  />
                  <MetricCard
                    title="Conversions"
                    value={result.metrics.conversions.toLocaleString()}
                    change="15.7%"
                    isPositive={true}
                    icon={<TrendingUp className="h-5 w-5 text-primary-500" />}
                  />
                </div>
              </div>

              {/* Performance Over Time */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Over Time</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="report_date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })} 
                        stroke="#718096" 
                      />
                      <YAxis stroke="#718096" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey={createDataKeyFn('metrics.impressions')}
                        name="Impressions" 
                        stroke="#0D47A1" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={createDataKeyFn('metrics.clicks')}
                        name="Clicks" 
                        stroke="#00BCD4" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={createDataKeyFn('metrics.conversions')}
                        name="Conversions" 
                        stroke="#FF5722" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ROI & Script Impact Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI Summary</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Campaign Cost</dt>
                      <dd className="text-sm font-semibold text-gray-900">${result.roi_metrics.total_campaign_cost.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Revenue Impact</dt>
                      <dd className="text-sm font-semibold text-gray-900">${result.roi_metrics.estimated_revenue_impact.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">ROI Percentage</dt>
                      <dd className="text-sm font-semibold text-green-600">{String(result.roi_metrics.roi_percentage)}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Cost per Conversion</dt>
                      <dd className="text-sm font-semibold text-gray-900">${String(result.roi_metrics.cost_per_conversion)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Impact</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">New Prescriptions</dt>
                      <dd className="text-sm font-semibold text-gray-900">{String(result.prescription_metrics.new_prescriptions)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Prescription Renewals</dt>
                      <dd className="text-sm font-semibold text-gray-900">{String(result.prescription_metrics.prescription_renewals)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Market Share Change</dt>
                      <dd className="text-sm font-semibold text-green-600">+{String(result.prescription_metrics.market_share_change)}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Patient Adherence Rate</dt>
                      <dd className="text-sm font-semibold text-gray-900">{String(result.prescription_metrics.patient_adherence_rate)}%</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Ad Performance Tab */}
          {selectedTab === 'adperformance' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Impressions"
                  value={result.metrics.impressions.toLocaleString()}
                  change="12.5%"
                  isPositive={true}
                  icon={<Users className="h-5 w-5 text-primary-500" />}
                />
                <MetricCard
                  title="Clicks"
                  value={result.metrics.clicks.toLocaleString()}
                  change="8.3%"
                  isPositive={true}
                  icon={<Activity className="h-5 w-5 text-primary-500" />}
                />
                <MetricCard
                  title="CTR"
                  value={`${((result.metrics.clicks / result.metrics.impressions) * 100).toFixed(2)}%`}
                  change="5.7%"
                  isPositive={true}
                  icon={<TrendingUp className="h-5 w-5 text-primary-500" />}
                />
                <MetricCard
                  title="CPC"
                  value={`$${result.roi_metrics.cost_per_click.toFixed(2)}`}
                  change="3.2%"
                  isPositive={false}
                  icon={<DollarSign className="h-5 w-5 text-primary-500" />}
                />
              </div>

              {/* Ad Performance by Channel */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance by Channel</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Display', impressions: 5200, clicks: 260, ctr: 5.0, cpc: 25.63 },
                        { name: 'Social', impressions: 3800, clicks: 190, ctr: 5.0, cpc: 28.12 },
                        { name: 'Email', impressions: 850, clicks: 59, ctr: 6.9, cpc: 22.35 },
                        { name: 'Search', impressions: 630, clicks: 15, ctr: 2.4, cpc: 35.90 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#718096" />
                      <YAxis yAxisId="left" orientation="left" stroke="#0D47A1" />
                      <YAxis yAxisId="right" orientation="right" stroke="#00BCD4" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="impressions" name="Impressions" fill="#0D47A1" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="clicks" name="Clicks" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ad Performance Over Time */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="report_date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })} 
                        stroke="#718096" 
                      />
                      <YAxis stroke="#718096" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={createDataKeyFn('metrics.impressions')}
                        name="Impressions" 
                        stroke="#0D47A1" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={createDataKeyFn('metrics.clicks')}
                        name="Clicks" 
                        stroke="#00BCD4" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Specialty and Regional Targeting Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Provider Specialty</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(result.prescription_metrics.prescription_by_specialty).map(([name, value]) => ({ 
                          name, 
                          impressions: Math.floor(value as number * 75 + Math.random() * 50),
                          clicks: Math.floor(value as number * 3.5 + Math.random() * 5)
                        }))} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" stroke="#718096" />
                        <YAxis dataKey="name" type="category" stroke="#718096" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="impressions" name="Impressions" fill="#4F46E5" />
                        <Bar dataKey="clicks" name="Clicks" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Region</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(result.prescription_metrics.prescription_by_region).map(([name, value]) => ({
                          name,
                          impressions: Math.floor(value as number * 120 + Math.random() * 80),
                          clicks: Math.floor(value as number * 5.2 + Math.random() * 8)
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" stroke="#718096" />
                        <YAxis dataKey="name" type="category" stroke="#718096" width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="impressions" name="Impressions" fill="#7C3AED" />
                        <Bar dataKey="clicks" name="Clicks" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Prescriptions Tab */}
          {selectedTab === 'prescriptions' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Impact Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Script Change"
                  value={`${String(result.prescription_metrics.total_prescription_change)}%`}
                  change="5.2%"
                  isPositive={true}
                  icon={<HeartPulse className="h-5 w-5 text-primary-500" />}
                />
                <MetricCard
                  title="New Prescriptions"
                  value={String(result.prescription_metrics.new_prescriptions)}
                  change="18.3%"
                  isPositive={true}
                  icon={<Microscope className="h-5 w-5 text-primary-500" />}
                />
                <MetricCard
                  title="Prescription Renewals"
                  value={String(result.prescription_metrics.prescription_renewals)}
                  change="12.4%"
                  isPositive={true}
                  icon={<Target className="h-5 w-5 text-primary-500" />}
                />
                <MetricCard
                  title="Market Share Change"
                  value={`+${String(result.prescription_metrics.market_share_change)}%`}
                  change="0.8%"
                  isPositive={true}
                  icon={<Globe className="h-5 w-5 text-primary-500" />}
                />
              </div>
              
              {/* Script Lift Comparison Component */}
              <ScriptLiftComparison campaignId={id} />
              
              {/* Prescription Category Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Prescription by Specialty</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={Object.entries(result.prescription_metrics.prescription_by_specialty).map(([name, value]) => ({ name, value }))} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#718096" />
                      <YAxis stroke="#718096" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Prescriptions" fill="#0D47A1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {/* ROI Analysis tab removed as requested */}
        </div>
      </div>
    </div>
  );
}
