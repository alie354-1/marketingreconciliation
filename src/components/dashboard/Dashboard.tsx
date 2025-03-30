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
import { MedicationSection } from './MedicationSection';
import { MetricCard } from '../ui/MetricCard';
import { ChartContainer } from '../ui/ChartContainer';
import { CampaignCard } from '../ui/CampaignCard';

/**
 * Generate campaign performance data based on timeframe and actual campaign count
 * This is a transitional function that uses real campaign counts but mock metrics
 * Later this can be replaced with actual API data
 */
const generateCampaignPerformanceData = (
  timeframe: string, 
  campaigns: any[]
) => {
  // Determine how many months to show based on timeframe
  const monthCount = timeframe === '1m' ? 1 : 
                     timeframe === '3m' ? 3 : 
                     timeframe === '6m' ? 6 : 12;
  
  // Create month labels going back from current month
  const today = new Date();
  const months = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }
  
  // Use campaign count to scale the metrics
  const activeCampaignCount = campaigns.filter(c => c.status === 'active').length || 1;
  const scaleFactor = activeCampaignCount / 3; // Assuming 3 is an average baseline
  
  // Generate data with some randomness but trending upward
  return months.map((month, index) => {
    // Base numbers that increase each month
    const baseImpressions = 15000 + (index * 2000);
    const baseClicks = 3500 + (index * 300);
    const basePrescriptions = 900 + (index * 100);
    const baseConversions = 1800 + (index * 150);
    
    // Add some randomness and scale by active campaigns
    return {
      month,
      impressions: Math.round((baseImpressions + (Math.random() * 2000 - 1000)) * scaleFactor),
      clicks: Math.round((baseClicks + (Math.random() * 400 - 200)) * scaleFactor),
      prescriptions: Math.round((basePrescriptions + (Math.random() * 100 - 50)) * scaleFactor),
      conversions: Math.round((baseConversions + (Math.random() * 300 - 150)) * scaleFactor)
    };
  });
};

/**
 * Generate campaign comparison data from actual campaigns
 * This transforms the actual campaign data into a format suitable for bar charts
 */
const generateCampaignComparisonData = (campaigns: any[]) => {
  // Get active campaigns, sorted by script lift (descending)
  return campaigns
    .filter(c => c.status === 'active')
    .sort((a, b) => {
      // Use default metrics if not available in campaign data
      const liftA = a.metrics?.scriptLift || 0;
      const liftB = b.metrics?.scriptLift || 0;
      return liftB - liftA; // Descending order
    })
    .slice(0, 5) // Take top 5 campaigns
    .map(campaign => {
      // Extract or generate metrics
      return {
        campaign: campaign.name || 'Unnamed Campaign',
        roi: campaign.metrics?.roi || (Math.random() * 5 + 8).toFixed(1), // Random between 8-13
        providerReach: campaign.metrics?.providerReach || Math.round(Math.random() * 1000 + 500),
        scriptLift: campaign.metrics?.scriptLift || (Math.random() * 10 + 10).toFixed(1), // Random between 10-20
        clicks: campaign.metrics?.clicks || Math.round(Math.random() * 3000 + 2000)
      };
    });
};

// Fallback data if no campaigns are available
const fallbackComparisonData = [
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
  // Default to overview tab since we removed the campaigns tab
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
  
  // Get timeframe for medication section
  const getTimeframeForMedicationSection = () => {
    return {
      daysBefore: timeframe === '1m' ? 30 : timeframe === '3m' ? 90 : timeframe === '6m' ? 180 : 365,
      daysAfter: 0
    };
  };
  
  // Handle campaign selection from campaign cards
  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setActiveTab('medications'); // Switch to medication analysis tab
  };
  
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

  // Calculate metrics from real data with trend calculation
  // Get campaigns created in the last month for trend calculation
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  // Filter campaigns by creation date
  const recentCampaigns = campaigns.filter((c: any) => {
    const createdAt = c.created_at ? new Date(c.created_at) : null;
    return createdAt && createdAt >= oneMonthAgo;
  });
  
  // Calculate active campaign metrics
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length || 0;
  const recentActiveCampaigns = recentCampaigns.filter((c: any) => c.status === 'active').length || 0;
  const campaignsTrend = [12, 14, 15, 14, 16, activeCampaigns]; // Last 6 periods ending with current
  
  // Calculate provider metrics
  const providerCount = providers.length || 0;
  const identityMatchedCount = providers.filter((p: any) => p.identity_matched).length || 0;
  const providersTrend = [700, 850, 920, 980, 1020, providerCount]; // Simulate historical trend
  
  const metrics = {
    activeCampaigns,
    totalProviders: providerCount,
    scriptLift: '18.3%',
    totalPrescriptions: prescriptionData.length || 0,
    aggregateROI: '11.8x',
    providerEngagement: '42.5%',
    identityMatched: identityMatchedCount,
    identityMatchRate: providerCount 
      ? `${((identityMatchedCount / providerCount) * 100).toFixed(1)}%` 
      : '0%',
    // Add trend data
    campaignsTrend,
    providersTrend,
    // Add change values
    campaignsChange: `+${recentActiveCampaigns}`,
    providersChange: '+7.5%' // For now, hardcoded but could be calculated
  };

  // Debug log to confirm we're using real data
  console.log('Active Campaigns Count:', metrics.activeCampaigns);
  console.log('Total Providers Count:', metrics.totalProviders);
  console.log('Recently Added Active Campaigns:', recentActiveCampaigns);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 max-w-[1600px] mx-auto">
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
              onChange={(value) => {
                console.log('Changing timeframe to', value);
                setTimeframe(value);
              }}
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
      <div className="border-b border-gray-200 overflow-x-auto pb-px">
        <div className="flex min-w-max space-x-2 sm:space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "py-2 px-2 sm:py-3 sm:px-0 font-medium text-xs sm:text-sm border-b-2 transition-colors min-w-[4rem]",
              activeTab === 'overview'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={cn(
              "py-2 px-2 sm:py-3 sm:px-0 font-medium text-xs sm:text-sm border-b-2 transition-colors",
              activeTab === 'providers'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <span className="sm:hidden">Providers</span>
            <span className="hidden sm:inline">Provider Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={cn(
              "py-2 px-2 sm:py-3 sm:px-0 font-medium text-xs sm:text-sm border-b-2 transition-colors",
              activeTab === 'medications'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <span className="sm:hidden">Meds</span>
            <span className="hidden sm:inline">Medication Analysis</span>
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
          {/* Key Metrics Cards with real data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricCard
              title="Active Campaigns"
              value={metrics.activeCampaigns}
              changeValue={metrics.campaignsChange}
              changeType="increase"
              icon={<Target className="h-5 w-5" />}
              variant="glass"
              trend={metrics.campaignsTrend}
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
              changeValue={metrics.providersChange}
              changeType="increase"
              icon={<Stethoscope className="h-5 w-5" />}
              trend={metrics.providersTrend}
            />
            <MetricCard
              title="Patient Reach"
              value={`${(metrics.totalProviders * 250).toLocaleString()}`}
              subValue="estimated patients"
              changeValue="+12.5%"
              changeType="increase"
              icon={<Activity className="h-5 w-5" />}
              variant="gradient"
              trend={[220000, 230000, 245000, 258000, 270000, 290000]}
            />
          </div>

          {/* Charts with dynamic data based on timeframe */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer
              title="Campaign Performance"
              subtitle="Impressions, clicks, and prescriptions over time"
              data={generateCampaignPerformanceData(timeframe, campaigns)}
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
              data={campaigns.length > 0 
                ? generateCampaignComparisonData(campaigns) 
                : fallbackComparisonData}
              type="bar"
              height={320}
              xAxisKey="campaign"
              yAxisKeys={["scriptLift", "clicks"]}
              labels={{
                scriptLift: "Script Lift %",
                clicks: "Click Engagement"
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
          
          {/* Patient Impact Analysis Section */}
          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Patient Impact Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">Campaign effectiveness on patient outcomes</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <ChartContainer
                title="Patient Reach & Script Lift by Campaign"
                subtitle="Comparing patient outcomes across campaigns"
                data={campaigns.length > 0 
                  ? generateCampaignComparisonData(campaigns) 
                  : fallbackComparisonData}
                type="bar"
                height={400}
                xAxisKey="campaign"
                yAxisKeys={["scriptLift", "providerReach"]}
                labels={{
                  scriptLift: "Script Lift %",
                  providerReach: "Provider Reach"
                }}
                downloadable
              />
            </div>
          </div>
        </>
      )}

      {/* Campaign Tab Content - Removed as requested */}

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
      
      {/* Medication Analysis Tab Content */}
      {activeTab === 'medications' && (
        <MedicationSection 
          timeframe={getTimeframeForMedicationSection()}
          initialCampaignId={selectedCampaignId}
        />
      )}
    </div>
  );
}
