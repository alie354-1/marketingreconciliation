import React, { useState, useEffect } from 'react';
import { MultiSelect } from '../ui/MultiSelect';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ChartContainer } from '../ui/ChartContainer';
import { TrendingUp, Pill, Target, Activity, Map, AlertCircle } from 'lucide-react';
import { fetchPrescriptionData } from '../../lib/prescriptionDataGenerator';
import { analyzePrescriptionData } from '../../lib/medicationMarketAnalytics';
import { 
  MedicationMarketMetrics,
  RegionalMarketMetrics,
  MarketMetricsSummary,
  MedicationComparisonParams 
} from '../../types/medicationComparison';
import { PrescriptionData } from '../../types/prescription';
import { cn } from '../../utils/cn';
import { TimeframeSelector, TimeframeRange } from '../campaigns/TimeframeSelector';
import { RegionalHeatMap } from '../visualizations/RegionalHeatMap';
import { colors } from '../../theme/colors';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

// Define custom colors for our charts
const CHART_COLORS = {
  target: colors.primary[500],
  targetLight: colors.primary[300],
  competitor: colors.warning[500], // Using warning instead of amber
  competitorLight: colors.warning[300],
  other: colors.gray[400],
  otherLight: colors.gray[300]
};

interface MedicationOption {
  id: string;
  name: string;
  category?: string;
  isTarget?: boolean;
  isCompetitor?: boolean;
}

interface RegionOption {
  id: string;
  name: string;
}

// Chart data interfaces
interface MarketShareChartData {
  name: string;
  marketShare: number;
  marketShareBefore: number;
  change: number;
  isTarget: boolean;
  isCompetitor?: boolean;
  fill: string;
}

interface ScriptLiftChartData {
  name: string;
  scriptLift: number;
  prescriptions: number;
  baseline: number;
  isTarget: boolean;
  isCompetitor?: boolean;
  fill: string;
}

interface MedicationComparisonChartProps {
  campaignId?: string;
  initialTargetMedication?: string;
  initialCompetitorMedications?: string[];
  initialTimeframe?: TimeframeRange;
  className?: string;
  showRegionalAnalysis?: boolean;
}

export const MedicationComparisonChart: React.FC<MedicationComparisonChartProps> = ({
  campaignId,
  initialTargetMedication,
  initialCompetitorMedications = [],
  initialTimeframe = { daysBefore: 30, daysAfter: 30 },
  className,
  showRegionalAnalysis = true
}) => {
  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData[]>([]);
  
  // Medication selection state
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [targetMedicationId, setTargetMedicationId] = useState<string | undefined>(initialTargetMedication);
  const [competitorMedicationIds, setCompetitorMedicationIds] = useState<string[]>(initialCompetitorMedications);
  
  // Region selection state
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  
  // Chart view state
  const [viewType, setViewType] = useState<'market-share' | 'script-lift' | 'regional'>('market-share');
  const [timeframe, setTimeframe] = useState<TimeframeRange>(initialTimeframe);
  
  // Analysis results
  const [medicationMetrics, setMedicationMetrics] = useState<MedicationMarketMetrics[]>([]);
  const [regionalMetrics, setRegionalMetrics] = useState<RegionalMarketMetrics[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketMetricsSummary | null>(null);
  
  // Highlight region in map
  const [highlightedRegion, setHighlightedRegion] = useState<string | undefined>();

  // Load prescription data
  const loadPrescriptionData = async () => {
    if (!campaignId && !targetMedicationId) {
      setError("Either a campaign ID or a target medication ID is required.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const effectiveCampaignId = campaignId || 'all';
      
      const result = await fetchPrescriptionData(
        effectiveCampaignId, 
        timeframe
      );
      
      if (result.error) {
        setError(result.error.message || 'Failed to fetch prescription data');
        return;
      }
      
      if (result.data && result.data.length > 0) {
        setPrescriptionData(result.data);
        
        // Extract unique medications from the data
        const medicationMap = new Map<string, any>({});
        const regionMap = new Map<string, any>({});
        
        result.data.forEach((item: PrescriptionData) => {
          // Add medication if not already added
          if (!medicationMap.has(item.medication_id)) {
            medicationMap.set(item.medication_id, {
              id: item.medication_id,
              name: item.medication_name,
              category: item.medication_category,
              isTarget: item.is_target,
              isCompetitor: item.is_competitor
            });
          }
          
          // Add region if not already added
          const region = item.provider_region || item.provider_geographic_area || '';
          if (region && !regionMap.has(region)) {
            regionMap.set(region, {
              id: region,
              name: region // Use region code as name for now
            });
          }
        });
        
        // Convert maps to arrays
        const medicationList = Array.from(medicationMap.values());
        const regionList = Array.from(regionMap.values());
        
        setMedications(medicationList as MedicationOption[]);
        setRegions(regionList as RegionOption[]);
        
        // Set default selected target if none is already selected
        if (!targetMedicationId && medicationList.length > 0) {
          // Prefer medications marked as target
          const defaultTarget = (medicationList.find((m: any) => m.isTarget) || medicationList[0]) as MedicationOption;
          setTargetMedicationId(defaultTarget.id);
        }
        
        // Set default competitors if none are already selected
        if (competitorMedicationIds.length === 0 && medicationList.length > 1) {
          // Use medications marked as competitors, or just the next 3 medications
          const competitors = medicationList
            .filter((m: any) => m.isCompetitor && m.id !== targetMedicationId)
            .map((m: any) => m.id);
          
          if (competitors.length > 0) {
            setCompetitorMedicationIds(competitors);
          } else {
            // Just use the first few non-target medications
            const otherMeds = medicationList
              .filter((m: any) => m.id !== targetMedicationId)
              .slice(0, 3)
              .map((m: any) => m.id);
            
            setCompetitorMedicationIds(otherMeds);
          }
        }
        
        // Analyze the prescription data
        await analyzeData();
      } else {
        setError('No prescription data found for the specified parameters.');
      }
    } catch (err) {
      console.error('Error in medication comparison:', err);
      setError('An error occurred while analyzing medication data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze the prescription data with market metrics
  const analyzeData = async () => {
    if (!targetMedicationId || prescriptionData.length === 0) {
      return;
    }
    
    try {
      const params: MedicationComparisonParams = {
        targetMedicationId,
        competitorMedicationIds,
        regions: selectedRegionIds.length > 0 ? selectedRegionIds : undefined,
        timeframe
      };
      
      const results = await analyzePrescriptionData(prescriptionData, params);
      
      setMedicationMetrics(results.medicationMetrics);
      setRegionalMetrics(results.regionalMetrics);
      setMarketSummary(results.summary);
    } catch (err) {
      console.error('Error analyzing prescription data:', err);
      setError('Failed to analyze medication market data.');
    }
  };

  // Load data on mount and when key parameters change
  useEffect(() => {
    loadPrescriptionData();
  }, [campaignId, timeframe]);

  // Re-analyze when selection changes
  useEffect(() => {
    if (prescriptionData.length > 0 && targetMedicationId) {
      analyzeData();
    }
  }, [targetMedicationId, competitorMedicationIds, selectedRegionIds, prescriptionData]);

  // Selection change handlers
  const handleTargetMedicationChange = (medicationId: string) => {
    // If the new target is currently a competitor, remove it from competitors
    if (competitorMedicationIds.includes(medicationId)) {
      setCompetitorMedicationIds(competitorMedicationIds.filter(id => id !== medicationId));
    }
    setTargetMedicationId(medicationId);
  };

  const handleCompetitorMedicationsChange = (medicationIds: string[]) => {
    // Ensure target medication is not in the competitors list
    const filteredIds = medicationIds.filter(id => id !== targetMedicationId);
    setCompetitorMedicationIds(filteredIds);
  };

  const handleRegionsChange = (regionIds: string[]) => {
    setSelectedRegionIds(regionIds);
  };

  const handleTimeframeChange = (newTimeframe: TimeframeRange) => {
    setTimeframe(newTimeframe);
  };

  // Format medication options for selectors
  const getTargetMedicationOptions = () => {
    return medications.map(med => ({
      value: med.id,
      label: med.name
    }));
  };

  const getCompetitorMedicationOptions = () => {
    return medications
      .filter(med => med.id !== targetMedicationId) // Exclude target
      .map(med => ({
        value: med.id,
        label: `${med.name}${med.isCompetitor ? ' (Competitor)' : ''}`
      }));
  };

  const getRegionOptions = () => {
    return regions.map(region => ({
      value: region.id,
      label: region.name
    }));
  };

  // Chart data preparation
  const getMarketShareChartData = (): MarketShareChartData[] => {
    if (medicationMetrics.length === 0) return [];
    
    return medicationMetrics.map(metric => ({
      name: metric.medicationName,
      marketShare: parseFloat(metric.marketShare.toFixed(1)),
      marketShareBefore: parseFloat(metric.marketShareBefore.toFixed(1)),
      change: parseFloat(metric.marketShareChange.toFixed(1)),
      isTarget: metric.isTarget,
      isCompetitor: metric.isCompetitor,
      fill: metric.isTarget ? CHART_COLORS.target : metric.isCompetitor ? CHART_COLORS.competitor : CHART_COLORS.other
    }));
  };

  const getScriptLiftChartData = (): ScriptLiftChartData[] => {
    if (medicationMetrics.length === 0) return [];
    
    return medicationMetrics.map(metric => ({
      name: metric.medicationName,
      scriptLift: parseFloat(metric.scriptLift.toFixed(1)),
      prescriptions: metric.prescriptionCount,
      baseline: metric.baselinePrescriptionCount,
      isTarget: metric.isTarget,
      isCompetitor: metric.isCompetitor,
      fill: metric.isTarget ? CHART_COLORS.target : metric.isCompetitor ? CHART_COLORS.competitor : CHART_COLORS.other
    }));
  };

  const getRegionalHeatMapData = () => {
    if (regionalMetrics.length === 0) return [];
    
    return regionalMetrics.map(region => ({
      id: region.region,
      name: region.regionName,
      providerCount: region.targetPrescriptions,
      percentage: region.targetShare
    }));
  };

  // Find the target medication name
  const getTargetMedicationName = () => {
    const targetMed = medications.find(med => med.id === targetMedicationId);
    return targetMed?.name || 'Selected Medication';
  };

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

  return (
    <div className={cn("bg-white p-6 rounded-lg shadow-sm", className)}>
      <div className="flex flex-col space-y-6">
        {/* Header with title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Medication Market Share Analysis</h3>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant={viewType === 'market-share' ? 'default' : 'outline'}
              onClick={() => setViewType('market-share')}
            >
              Market Share
            </Button>
            <Button 
              size="sm" 
              variant={viewType === 'script-lift' ? 'default' : 'outline'}
              onClick={() => setViewType('script-lift')}
            >
              Script Lift
            </Button>
            {showRegionalAnalysis && (
              <Button 
                size="sm" 
                variant={viewType === 'regional' ? 'default' : 'outline'}
                onClick={() => setViewType('regional')}
              >
                Regional
              </Button>
            )}
          </div>
        </div>
        
        {/* Medication selection section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Target className="h-4 w-4 text-primary-600 mr-1.5" />
              <label className="block text-sm font-medium text-gray-700">
                Target Medication
              </label>
            </div>
            <Select
              options={getTargetMedicationOptions()}
              value={targetMedicationId || ''}
              onChange={handleTargetMedicationChange}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              This is the primary medication you want to analyze
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <Pill className="h-4 w-4 text-amber-600 mr-1.5" />
              <label className="block text-sm font-medium text-gray-700">
                Competitor Medications
              </label>
            </div>
            <MultiSelect
              options={getCompetitorMedicationOptions()}
              value={competitorMedicationIds}
              onChange={handleCompetitorMedicationsChange}
              placeholder="Select competitor medications"
            />
            <p className="mt-1 text-xs text-gray-500">
              Select medications to compare against the target
            </p>
          </div>
        </div>
        
        {/* Filters section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Map className="h-4 w-4 text-gray-600 mr-1.5" />
              <label className="block text-sm font-medium text-gray-700">
                Regions
              </label>
            </div>
            <MultiSelect
              options={getRegionOptions()}
              value={selectedRegionIds}
              onChange={handleRegionsChange}
              placeholder="All regions (optional)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Filter by specific regions or leave empty for all regions
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <Activity className="h-4 w-4 text-gray-600 mr-1.5" />
              <label className="block text-sm font-medium text-gray-700">
                Time Period
              </label>
            </div>
            <TimeframeSelector
              value={timeframe}
              onChange={handleTimeframeChange}
              minDays={7}
              maxDays={180}
            />
          </div>
        </div>
        
        {/* Market summary metrics */}
        {marketSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Market Share</span>
              <span className="text-xl font-bold">{marketSummary.targetOverallShare.toFixed(1)}%</span>
              <span className={cn(
                "text-sm",
                marketSummary.targetShareChange >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {marketSummary.targetShareChange >= 0 ? "+" : ""}
                {marketSummary.targetShareChange.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Market Position</span>
              <span className="text-xl font-bold">
                {medicationMetrics.find(m => m.isTarget)?.marketRank || "-"}
                <span className="text-sm font-normal"> of {medicationMetrics.length}</span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Leading Regions</span>
              <span className="text-base font-medium">
                {marketSummary.targetLeadingRegions.length > 0 
                  ? marketSummary.targetLeadingRegions.slice(0, 2).join(", ")
                  : "None"}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Growth Regions</span>
              <span className="text-base font-medium">
                {marketSummary.fastestGrowingRegions.length > 0 
                  ? marketSummary.fastestGrowingRegions.slice(0, 2).join(", ")
                  : "None"}
              </span>
            </div>
          </div>
        )}
        
        {/* Charts */}
        <div className="mt-4">
          {viewType === 'market-share' && (
            <ChartContainer
              title={`Market Share: ${getTargetMedicationName()} vs. Competitors`}
              subtitle="Current market share percentage by medication"
              data={getMarketShareChartData()}
              type="bar"
              height={350}
              xAxisKey="name"
              yAxisKeys={["marketShare", "marketShareBefore"]}
              labels={{
                marketShare: "Current Share %",
                marketShareBefore: "Previous Share %"
              }}
              downloadable
            >
              <BarChart data={getMarketShareChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="marketShare" 
                  name="Current Share %"
                  fill={CHART_COLORS.target}
                  radius={[4, 4, 0, 0]} 
                >
                  {getMarketShareChartData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isTarget ? CHART_COLORS.target : entry.isCompetitor ? CHART_COLORS.competitor : CHART_COLORS.other} 
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="marketShareBefore" 
                  name="Previous Share %"
                  fill={CHART_COLORS.targetLight}
                  radius={[4, 4, 0, 0]} 
                >
                  {getMarketShareChartData().map((entry, index) => (
                    <Cell 
                      key={`cell-before-${index}`} 
                      fill={entry.isTarget ? CHART_COLORS.targetLight : entry.isCompetitor ? CHART_COLORS.competitorLight : CHART_COLORS.otherLight} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
          
          {viewType === 'script-lift' && (
            <ChartContainer
              title={`Script Lift: ${getTargetMedicationName()} vs. Competitors`}
              subtitle="Percentage change in prescription volume"
              data={getScriptLiftChartData()}
              type="bar"
              height={350}
              xAxisKey="name"
              yAxisKeys={["scriptLift"]}
              labels={{
                scriptLift: "Script Lift %"
              }}
              downloadable
            >
              <BarChart data={getScriptLiftChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="scriptLift" 
                  name="Script Lift %"
                >
                  {getScriptLiftChartData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isTarget ? CHART_COLORS.target : entry.isCompetitor ? CHART_COLORS.competitor : CHART_COLORS.other} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
          
          {viewType === 'regional' && showRegionalAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RegionalHeatMap
                regions={getRegionalHeatMapData()}
                totalProviders={
                  regionalMetrics.reduce((sum, r) => sum + r.targetPrescriptions, 0)
                }
                title={`Regional Market Share: ${getTargetMedicationName()}`}
                subtitle="Market share percentage by region"
                colorScale={[
                  colors.primary[50],
                  colors.primary[100],
                  colors.primary[200],
                  colors.primary[300],
                  colors.primary[400],
                  colors.primary[500],
                  colors.primary[600],
                  colors.primary[700]
                ]}
                highlightedRegion={highlightedRegion}
                onRegionClick={(region) => {
                  setHighlightedRegion(region.id === highlightedRegion ? undefined : region.id);
                }}
              />
              
              <ChartContainer
                title="Top Regions by Market Share"
                subtitle="Target medication's share by region"
                data={regionalMetrics
                  .sort((a, b) => b.targetShare - a.targetShare)
                  .slice(0, 5)
                  .map(region => ({
                    name: region.regionName,
                    targetShare: parseFloat(region.targetShare.toFixed(1)),
                    competitorShare: parseFloat(region.averageCompetitorShare.toFixed(1)),
                    highlighted: region.region === highlightedRegion
                  }))}
                type="bar"
                height={350}
                xAxisKey="name"
                yAxisKeys={["targetShare", "competitorShare"]}
                labels={{
                  targetShare: "Target Share %",
                  competitorShare: "Avg. Competitor Share %"
                }}
              >
                <BarChart 
                  data={regionalMetrics
                    .sort((a, b) => b.targetShare - a.targetShare)
                    .slice(0, 5)
                    .map(region => ({
                      name: region.regionName,
                      targetShare: parseFloat(region.targetShare.toFixed(1)),
                      competitorShare: parseFloat(region.averageCompetitorShare.toFixed(1)),
                      highlighted: region.region === highlightedRegion
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="targetShare" 
                    name="Target Share %"
                    fill={colors.primary[500]}
                  >
                    {regionalMetrics
                      .sort((a, b) => b.targetShare - a.targetShare)
                      .slice(0, 5)
                      .map((region, index) => (
                        <Cell 
                          key={`target-cell-${index}`} 
                          fill={region.region === highlightedRegion ? colors.primary[700] : colors.primary[500]} 
                        />
                      ))}
                  </Bar>
                  <Bar 
                    dataKey="competitorShare" 
                    name="Avg. Competitor Share %"
                    fill={colors.warning[500]}
                  >
                    {regionalMetrics
                      .sort((a, b) => b.targetShare - a.targetShare)
                      .slice(0, 5)
                      .map((region, index) => (
                        <Cell 
                          key={`comp-cell-${index}`} 
                          fill={region.region === highlightedRegion ? colors.warning[700] : colors.warning[500]} 
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
