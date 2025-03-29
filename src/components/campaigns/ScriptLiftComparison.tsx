import React, { useState, useEffect } from 'react';
import { Select } from '../ui/Select';
import { TrendingUp, ArrowUp, ArrowDown, Pill, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { cn } from '../../utils/cn';
import { 
  fetchPrescriptionData, 
  groupPrescriptionData 
} from '../../lib/prescriptionDataGenerator';
import { PrescriptionData, PrescriptionSummary, PrescriptionGroupBy } from '../../types/prescription';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectCurrentCampaign } from '../../store/slices/campaignSlice';

interface MedicationOption {
  id: string;
  name: string;
  isTarget?: boolean;
  isCompetitor?: boolean;
}

// Default medications to display if no data is available
const DEFAULT_MEDICATIONS: MedicationOption[] = [
  { id: 'target', name: 'Target Medication', isTarget: true },
  { id: 'competitor', name: 'Competitor Medications', isCompetitor: true }
];

interface ScriptLiftComparisonProps {
  campaignId?: string;
}

export const ScriptLiftComparison: React.FC<ScriptLiftComparisonProps> = ({ campaignId }) => {
  const campaign = useAppSelector(selectCurrentCampaign);
  const effectiveCampaignId = campaignId || campaign?.id;
  
  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData[]>([]);
  const [medicationOptions, setMedicationOptions] = useState<MedicationOption[]>(DEFAULT_MEDICATIONS);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>('');
  const [comparisonType, setComparisonType] = useState('medication'); // 'medication' or 'specialty'
  const [groupedData, setGroupedData] = useState<PrescriptionSummary[]>([]);
  
  // Fetch prescription data when campaign ID changes
  useEffect(() => {
    if (!effectiveCampaignId) return;

    async function loadPrescriptionData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the non-null assertion operator since we've already checked that effectiveCampaignId is not nullish
        const result = await fetchPrescriptionData(effectiveCampaignId!);
        if (result.error) {
          setError(result.error.message || 'Failed to fetch prescription data');
          return;
        }
        
        if (result.data && result.data.length > 0) {
          setPrescriptionData(result.data);
          
          // Extract unique medications from the data
          const medications: MedicationOption[] = [];
          const medicationMap = new Map<string, MedicationOption>();
          
          result.data.forEach(item => {
            if (!medicationMap.has(item.medication_id)) {
              medicationMap.set(item.medication_id, {
                id: item.medication_id,
                name: item.medication_name,
                isTarget: item.is_target,
                isCompetitor: item.is_competitor
              });
            }
          });
          
          // Convert map to array and sort (target medications first)
          const medicationList = Array.from(medicationMap.values()).sort((a, b) => {
            if (a.isTarget && !b.isTarget) return -1;
            if (!a.isTarget && b.isTarget) return 1;
            return a.name.localeCompare(b.name);
          });
          
          setMedicationOptions(medicationList.length > 0 ? medicationList : DEFAULT_MEDICATIONS);
          
          // Select the first medication by default (preferably a target medication)
          const targetMedication = medicationList.find(med => med.isTarget);
          setSelectedMedicationId(targetMedication?.id || medicationList[0]?.id || '');
        } else {
          setPrescriptionData([]);
          setMedicationOptions(DEFAULT_MEDICATIONS);
          setSelectedMedicationId(DEFAULT_MEDICATIONS[0].id);
        }
      } catch (err) {
        console.error('Error fetching prescription data:', err);
        setError('Failed to load prescription data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPrescriptionData();
  }, [effectiveCampaignId]);
  
  // Group data when medication or comparison type changes
  useEffect(() => {
    if (prescriptionData.length === 0 || !selectedMedicationId) {
      setGroupedData([]);
      return;
    }
    
    // Filter data based on selected medication
    let filteredData = prescriptionData;
    
    if (comparisonType === 'medication') {
      // Just show the selected medication's data
      filteredData = prescriptionData.filter(item => 
        item.medication_id === selectedMedicationId
      );
      
      // Create a simple summary for this medication
      const beforeTotal = filteredData.reduce((sum, item) => sum + item.baseline_count, 0);
      const afterTotal = filteredData.reduce((sum, item) => sum + item.current_count, 0);
      const changeCount = afterTotal - beforeTotal;
      const changePercentage = beforeTotal > 0 ? (changeCount / beforeTotal) * 100 : 0;
      
      const summaries: PrescriptionSummary[] = [{
        group_key: 'before',
        group_name: 'Before Campaign',
        baseline_total: beforeTotal,
        current_total: beforeTotal, // Same value for consistency
        change_count: 0,
        change_percentage: 0,
        records_count: filteredData.length
      }, {
        group_key: 'after',
        group_name: 'After Campaign',
        baseline_total: beforeTotal,
        current_total: afterTotal,
        change_count: changeCount,
        change_percentage: parseFloat(changePercentage.toFixed(2)),
        records_count: filteredData.length
      }];
      
      setGroupedData(summaries);
    } else if (comparisonType === 'specialty') {
      // Group data by provider specialty
      const grouped = groupPrescriptionData(filteredData, 'provider_specialty');
      setGroupedData(grouped);
    } else if (comparisonType === 'competitive') {
      // Group by medication, but include both target and competitors
      const selectedMed = medicationOptions.find(med => med.id === selectedMedicationId);
      
      if (selectedMed?.isTarget) {
        // If target medication selected, show it vs competitors
        filteredData = prescriptionData.filter(item => 
          item.is_target || item.is_competitor
        );
      } else {
        // Otherwise just show the selected medication vs the target
        filteredData = prescriptionData.filter(item => 
          item.medication_id === selectedMedicationId || item.is_target
        );
      }
      
      const grouped = groupPrescriptionData(filteredData, 'medication');
      setGroupedData(grouped);
    }
  }, [prescriptionData, selectedMedicationId, comparisonType, medicationOptions]);
  
  // Format chart data based on comparison type
  const chartData = React.useMemo(() => {
    if (groupedData.length === 0) return [];
    
    if (comparisonType === 'medication') {
      // For single medication, we want before/after bars
      return groupedData.map(group => ({
        name: group.group_name,
        prescriptions: group.group_key === 'before' ? group.baseline_total : group.current_total,
        fill: group.group_key === 'before' ? '#94A3B8' : '#10B981'
      }));
    } else {
      // For specialty or competitive comparison, show both values for each group
      return groupedData.map(group => ({
        name: group.group_name,
        before: group.baseline_total,
        after: group.current_total,
        change: group.change_percentage
      }));
    }
  }, [groupedData, comparisonType]);
  
  // Get the currently selected medication's data
  const selectedMedication = medicationOptions.find(med => med.id === selectedMedicationId) || medicationOptions[0];
  
  // Calculate overall metrics for the selected medication
  const metrics = React.useMemo(() => {
    if (groupedData.length === 0) {
      return {
        beforeTotal: 0,
        afterTotal: 0,
        changeCount: 0,
        changePercentage: 0
      };
    }
    
    if (comparisonType === 'medication') {
      const beforeGroup = groupedData.find(g => g.group_key === 'before');
      const afterGroup = groupedData.find(g => g.group_key === 'after');
      
      if (!beforeGroup || !afterGroup) {
        return {
          beforeTotal: 0,
          afterTotal: 0,
          changeCount: 0,
          changePercentage: 0
        };
      }
      
      return {
        beforeTotal: beforeGroup.baseline_total,
        afterTotal: afterGroup.current_total,
        changeCount: afterGroup.change_count,
        changePercentage: afterGroup.change_percentage
      };
    } else {
      // For other comparison types, find just the selected medication's data
      const selectedData = prescriptionData.filter(
        item => item.medication_id === selectedMedicationId
      );
      
      const beforeTotal = selectedData.reduce((sum, item) => sum + item.baseline_count, 0);
      const afterTotal = selectedData.reduce((sum, item) => sum + item.current_count, 0);
      const changeCount = afterTotal - beforeTotal;
      const changePercentage = beforeTotal > 0 ? (changeCount / beforeTotal) * 100 : 0;
      
      return {
        beforeTotal,
        afterTotal,
        changeCount,
        changePercentage: parseFloat(changePercentage.toFixed(1))
      };
    }
  }, [groupedData, comparisonType, selectedMedicationId, prescriptionData]);
  
  // Colors for UI elements
  const changeColor = metrics.changePercentage >= 0 ? 'text-green-600' : 'text-red-600';
  const barColor = metrics.changePercentage >= 0 ? '#10B981' : '#EF4444';
  
  // Select options for the UI
  const medicationSelectOptions = medicationOptions.map(med => ({
    value: med.id,
    label: `${med.name}${med.isTarget ? ' (Target)' : ''}${med.isCompetitor ? ' (Competitor)' : ''}`
  }));
  
  const comparisonOptions = [
    { value: 'medication', label: 'Before/After' },
    { value: 'specialty', label: 'By Specialty' },
    { value: 'competitive', label: 'Competitive' }
  ];
  
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">
          Script Lift Comparison
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto sm:max-w-md">
          <div className="w-full sm:w-2/3">
            <Select
              label="Medication"
              options={medicationSelectOptions}
              value={selectedMedicationId}
              onChange={setSelectedMedicationId}
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Select
              label="View"
              options={comparisonOptions}
              value={comparisonType}
              onChange={setComparisonType}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Pill className="h-5 w-5 text-primary-500 mr-2" />
                <h4 className="font-medium text-gray-900">
                  {selectedMedication?.name}
                </h4>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                {comparisonType === 'medication' 
                  ? 'Prescription volume before and after the campaign period.'
                  : comparisonType === 'specialty'
                    ? 'Prescription change by provider specialty.'
                    : 'Comparing against competitor medications.'}
              </p>
            </div>
            
            <div>
              <div className="flex items-baseline mb-1">
                <span className="text-3xl font-bold mr-2">
                  {metrics.changePercentage >= 0 ? '+' : ''}
                  {metrics.changePercentage.toFixed(1)}%
                </span>
                <span className={cn("flex items-center", changeColor)}>
                  {metrics.changePercentage >= 0 
                    ? <ArrowUp className="h-4 w-4 mr-1" /> 
                    : <ArrowDown className="h-4 w-4 mr-1" />}
                  Change
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-gray-500">Before</div>
                  <div className="font-medium">{metrics.beforeTotal}</div>
                </div>
                <div className="border-l pl-4">
                  <div className="text-gray-500">After</div>
                  <div className="font-medium">{metrics.afterTotal}</div>
                </div>
                <div className="border-l pl-4">
                  <div className="text-gray-500">Difference</div>
                  <div className={cn("font-medium", changeColor)}>
                    {metrics.changeCount > 0 ? '+' : ''}
                    {metrics.changeCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-4">
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {comparisonType === 'medication' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#718096" />
                    <YAxis stroke="#718096" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="prescriptions" 
                      name="Prescriptions" 
                      fill={barColor} 
                      radius={[4, 4, 0, 0]} 
                    />
                    {metrics.beforeTotal > 0 && (
                      <ReferenceLine 
                        y={metrics.beforeTotal} 
                        stroke="#718096" 
                        strokeDasharray="3 3"
                        label={{ value: 'Baseline', position: 'right', fill: '#718096', fontSize: 12 }} 
                      />
                    )}
                  </BarChart>
                ) : (
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout={comparisonType === 'competitive' ? 'vertical' : 'horizontal'}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    {comparisonType === 'competitive' ? (
                      <>
                        <XAxis type="number" stroke="#718096" />
                        <YAxis dataKey="name" type="category" stroke="#718096" width={120} />
                      </>
                    ) : (
                      <>
                        <XAxis dataKey="name" stroke="#718096" />
                        <YAxis stroke="#718096" />
                      </>
                    )}
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="before" name="Before" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" name="After" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-2">No data available for the selected options</p>
                <p className="text-sm text-gray-400">Try selecting a different medication or view type</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
