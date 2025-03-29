import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCampaigns } from '../../store/slices/campaignSlice';
import { fetchProviders } from '../../store/slices/providerSlice';
import { fetchTableData } from '../../lib/database';
import {
  TrendingUp,
  Users,
  Target,
  ChevronRight,
  Plus,
  Activity,
  PieChart as PieChartIcon,
  Globe,
  Filter,
  Calendar,
  Pill,
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';
import { colors } from '../../theme/colors';

// Import our new UI components
import { MetricCard } from '../ui/MetricCard';
import { ChartContainer } from '../ui/ChartContainer';
import { CampaignCard } from '../ui/CampaignCard';

// Sample data for charts - this would come from the API in a real implementation
const campaignPerformanceData = [
  { month: 'Jan', impressions: 15200, clicks: 3800, prescriptions: 980, conversions: 1850 },
  { month: 'Feb', impressions: 17500, clicks: 4300, prescriptions: 1100, conversions: 2100 },
  { month: 'Mar', impressions: 16800, clicks: 4200, prescriptions: 1040, conversions: 1950 },
  { month: 'Apr', impressions: 19200, clicks: 4700, prescriptions: 1220, conversions: 2290 },
  { month: 'May', impressions: 22900, clicks: 5600, prescriptions: 1450, conversions: 2670 },
  { month: 'Jun', impressions: 28700, clicks: 7000, prescriptions: 1800, conversions: 3300 },
];

const campaignComparisonData = [
  { campaign: 'Lipitor Q1', roi: 12.5, providerReach: 1250, scriptLift: 18.3, clicks: 3800 },
  { campaign: 'Plavix Q1', roi: 9.8, providerReach: 980, scriptLift: 14.2, clicks: 2900 },
  { campaign: 'Metformin Q2', roi: 15.2, providerReach: 1580, scriptLift: 22.7, clicks: 4700 },
  { campaign: 'Januvia Q2', roi: 11.3, providerReach: 1140, scriptLift: 16.8, clicks: 3500 },
  { campaign: 'Crestor Q2', roi: 13.7, providerReach: 1350, scriptLift: 19.5, clicks: 4100 },
];

const specialtyDistributionData = [
  { name: 'Primary Care', value: 42 },
  { name: 'Cardiology', value: 23 },
  { name: 'Endocrinology', value: 15 },
  { name: 'Psychiatry', value: 12 },
  { name: 'Other', value: 8 },
];

const regionDistributionData = [
  { name: 'Northeast', value: 32 },
  { name: 'Midwest', value: 27 },
  { name: 'South', value: 25 },
  { name: 'West', value: 16 },
];

// Sample campaign data with detailed metrics
const sampleCampaignData = [
  {
    id: 'c1',
    name: 'Lipitor Awareness Campaign',
    target: {
      specialty: 'Cardiology',
      geographic: 'Northeast',
      condition: 'Hyperlipidemia',
      medication: 'Lipitor'
    },
    metrics: {
      impressions: 156000,
      clicks: 7800,
      conversions: 3120,
      scriptLift: 17.8,
      roi: 13.2,
      providerReach: 1250
    },
    status: 'active',
    startDate: '2025-01-15',
    endDate: '2025-04-15'
  },
  {
    id: 'c2',
    name: 'Metformin Targeting Campaign',
    target: {
      specialty: 'Endocrinology',
      geographic: 'Nationwide',
      condition: 'Type 2 Diabetes',
      medication: 'Metformin'
    },
    metrics: {
      impressions: 203000,
      clicks: 9500,
      conversions: 4270,
      scriptLift: 22.3,
      roi: 15.7,
      providerReach: 1580
    },
    status: 'active',
    startDate: '2025-02-01',
    endDate: '2025-05-01'
  },
  {
    id: 'c3',
    name: 'Plavix Provider Engagement',
    target: {
      specialty: 'Cardiology',
      geographic: 'Midwest',
      condition: 'Post-MI Maintenance',
      medication: 'Plavix'
    },
    metrics: {
      impressions: 142000,
      clicks: 6100,
      conversions: 2440,
      scriptLift: 14.2,
      roi: 9.8,
      providerReach: 980
    },
    status: 'active',
    startDate: '2025-01-10',
    endDate: '2025-04-10'
  }
];

export function Dashboard() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('6m');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get state with type assertions for now
  const campaigns = useAppSelector(state => {
    const campaignsState = state.campaigns as { campaigns: any[]; isLoading: boolean };
    return campaignsState.campaigns || [];
  });
  
  const providers = useAppSelector(state => {
    const providersState = state.providers as { providers: any[]; isLoading: boolean };
    return providersState.providers || [];
  });

  // Get reference data
  const specialties = useAppSelector(state => {
    const refData = state.referenceData as { specialties: any[] };
    return refData.specialties || [];
  });

  // State for actual DB data
  const [prescriptionData, setPrescriptionData] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch campaign and provider data from Redux
        await Promise.all([
          dispatch(fetchCampaigns()),
          dispatch(fetchProviders())
        ]);
        
        // Try to fetch prescription data directly from the database
        try {
          const { data, error } = await fetchTableData('prescriptions', ['id', 'provider_id', 'medication_id', 'condition_id', 'prescription_date'], 100);
          if (error) {
            setDbError(`Failed to fetch prescription data: ${error}`);
          } else {
            setPrescriptionData(data || []);
          }
        } catch (dbError: any) {
          setDbError(dbError.message || 'Database error');
          console.error('Database error:', dbError);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Calculate metrics (in a real app, these would come from backend aggregations)
  const metrics = {
    activeCampaigns: campaigns.filter((c: any) => c.status === 'active').length || 0,
    totalProviders: providers.length || 0,
    scriptLift: '18.3%',
    totalPrescriptions: prescriptionData.length || 0,
    aggregateROI: '11.8x',
    providerEngagement: '42.5%',
    identityMatched: providers.filter((p: any) => p.identity_matched).length || 0,
    identityMatchRate: providers.length 
      ? `${((providers.filter((p: any) => p.identity_matched).length / providers.length) * 100).toFixed(1)}%` 
      : '0%'
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Performance</h1>
          <p className="text-gray-500 mt-1">Track and analyze marketing campaign metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
            <Select
              options={[
                { value: '1m', label: 'Last Month' },
                { value: '3m', label: 'Last 3 Months' },
                { value: '6m', label: 'Last 6 Months' },
                { value: '1y', label: 'Last Year' },
              ]}
              value={timeframe}
              onChange={setTimeframe}
            />
          </div>
          <Link to="/campaigns/create">
            <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'overview'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={cn(
              "py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'campaigns'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={cn(
              "py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'providers'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Provider Analysis
          </button>
        </div>
      </div>

      {/* Database Error Notification */}
      {dbError && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-danger-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800">Database Error</h3>
              <div className="mt-2 text-sm text-danger-700">
                <p>{dbError}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    className="bg-danger-50 px-2 py-1.5 rounded-md text-sm font-medium text-danger-800 hover:bg-danger-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
                  >
                    View Migration Console
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Active Campaigns"
              value={metrics.activeCampaigns}
              changeValue="+3"
              changeType="increase"
              icon={<Target className="h-5 w-5" />}
              variant="glass"
            />
            <MetricCard
              title="Rx Lift"
              value={metrics.scriptLift}
              subValue="across all campaigns"
              changeValue="+3.2%"
              changeType="increase"
              icon={<Pill className="h-5 w-5" />}
              variant="gradient"
              trend={[12, 15, 14, 18, 16, 20]}
            />
            <MetricCard
              title="Provider Reach"
              value={metrics.totalProviders.toLocaleString()}
              subValue="unique providers"
              changeValue="+7.5%"
              changeType="increase"
              icon={<Stethoscope className="h-5 w-5" />}
            />
            <MetricCard
              title="Aggregate ROI"
              value={metrics.aggregateROI}
              changeValue="+1.2x"
              changeType="increase"
              icon={<TrendingUp className="h-5 w-5" />}
              trend={[8, 9.5, 10.2, 9.8, 11.8]}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer
              title="Campaign Performance"
              subtitle="Impressions, clicks, and prescriptions over time"
              data={campaignPerformanceData}
              type="line"
              height={320}
              xAxisKey="month"
              yAxisKeys={["impressions", "clicks", "prescriptions"]}
              labels={{
                impressions: "Ad Impressions",
                clicks: "Ad Clicks",
                prescriptions: "New Prescriptions"
              }}
              downloadable
            />

            <ChartContainer
              title="Prescription Impact"
              subtitle="Campaign influence on prescription behavior"
              data={campaignComparisonData}
              type="bar"
              height={320}
              xAxisKey="campaign"
              yAxisKeys={["scriptLift", "roi"]}
              labels={{
                scriptLift: "Script Lift %",
                roi: "ROI Multiple"
              }}
              downloadable
            />
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer
              title="Provider Specialty Distribution"
              subtitle="Breakdown of targeted providers by specialty"
              data={specialtyDistributionData}
              type="pie"
              height={300}
              xAxisKey="name"
              yAxisKeys={["value"]}
              labels={{
                value: "Percentage"
              }}
            />

            <ChartContainer
              title="Geographic Targeting Distribution"
              subtitle="Campaign reach by geographic region"
              data={regionDistributionData}
              type="pie"
              height={300}
              xAxisKey="name"
              yAxisKeys={["value"]}
              labels={{
                value: "Percentage"
              }}
            />
          </div>
        </>
      )}

      {/* Campaign Tab Content */}
      {activeTab === 'campaigns' && (
        <>
          <div className="grid grid-cols-1 gap-8">
            {sampleCampaignData.map(campaign => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                target={campaign.target}
                metrics={campaign.metrics}
                status={campaign.status as any}
                startDate={campaign.startDate}
                endDate={campaign.endDate}
              />
            ))}
          </div>
        </>
      )}

      {/* Provider Analysis Tab Content */}
      {activeTab === 'providers' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer
              title="Provider Specialty Distribution"
              subtitle="Target audience by medical specialty"
              data={specialtyDistributionData}
              type="pie"
              height={350}
              xAxisKey="name"
              yAxisKeys={["value"]}
              labels={{
                value: "Percentage"
              }}
            />

            <ChartContainer
              title="Provider Engagement by Specialty"
              subtitle="Campaign effectiveness across specialties"
              data={[
                { specialty: 'Primary Care', engagement: 58, prescriptions: 1250 },
                { specialty: 'Cardiology', engagement: 72, prescriptions: 980 },
                { specialty: 'Endocrinology', engagement: 68, prescriptions: 780 },
                { specialty: 'Psychiatry', engagement: 41, prescriptions: 540 },
                { specialty: 'Other', engagement: 35, prescriptions: 420 },
              ]}
              type="bar"
              height={350}
              xAxisKey="specialty"
              yAxisKeys={["engagement", "prescriptions"]}
              labels={{
                engagement: "Engagement Rate (%)",
                prescriptions: "Prescriptions"
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
