import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
import { ArrowUp, ArrowDown, Equal, Activity, Users, Target, ChevronLeft, Edit, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { EnhancedSegmentBreakdown } from './EnhancedSegmentBreakdown';
import { RegionalHeatMap } from './RegionalHeatMap';

// Type definition for audience configuration
export interface AudienceConfig {
  id?: string;
  name: string;
  filters: {
    medicationCategory: string;
    medications: string[];
    excludedMedications: string[];
    specialties: string[];
    regions: string[];
    prescribingVolume: string;
    timeframe: string;
  };
  providerCount: number;
  potentialReach: number;
  segments: {
    id: string;
    name: string;
    value: number;
    percentage: number;
    color?: string;
    regions?: { name: string; count: number }[];
  }[];
  regionData: {
    id: string;
    name: string;
    providerCount: number;
    percentage?: number;
  }[];
  dateCreated?: string;
}

interface MetricDifference {
  label: string;
  primary: number;
  secondary: number;
  difference: number;
  percentChange: number;
  isPositive: boolean;
}

interface AudienceComparisonViewProps {
  primaryAudience: AudienceConfig;
  secondaryAudience: AudienceConfig;
  onBack: () => void;
  onPushToCampaign: (audience: AudienceConfig) => void;
  onSaveAudience: (audience: AudienceConfig) => void;
}

export const AudienceComparisonView: React.FC<AudienceComparisonViewProps> = ({
  primaryAudience,
  secondaryAudience,
  onBack,
  onPushToCampaign,
  onSaveAudience,
}) => {
  // Detect if we're in self-comparison mode (same audience being compared with itself)
  const isSelfComparisonMode = primaryAudience.id === secondaryAudience.id;
  // Sample medication categories as SelectOptions
  const medicationCategoryOptions = [
    { value: "Cardiovascular", label: "Cardiovascular" },
    { value: "Respiratory", label: "Respiratory" },
    { value: "Neurological", label: "Neurological" },
    { value: "Gastrointestinal", label: "Gastrointestinal" },
    { value: "Endocrine", label: "Endocrine" },
    { value: "Psychiatric", label: "Psychiatric" },
    { value: "Infectious Disease", label: "Infectious Disease" },
    { value: "Oncology", label: "Oncology" },
    { value: "Pain Management", label: "Pain Management" },
    { value: "Any", label: "Any" }
  ];
  // Add edit mode state
  const [isEditing, setIsEditing] = useState(false);
  
  // Create a draft state for the audience being edited
  const [draftAudience, setDraftAudience] = useState<AudienceConfig | null>(null);
  
  // New state for side-by-side comparison
  const [modifiedAudience, setModifiedAudience] = useState<AudienceConfig | null>(null);
  const [modifiedMetrics, setModifiedMetrics] = useState<{
    providerCount: number;
    potentialReach: number;
  } | null>(null);
  
  // Initialize modified audience from primary audience
  useEffect(() => {
    // Create a deep copy of the primary audience
    setModifiedAudience(JSON.parse(JSON.stringify(primaryAudience)));
    
    // Initialize metrics
    setModifiedMetrics({
      providerCount: primaryAudience.providerCount,
      potentialReach: primaryAudience.potentialReach
    });
    
    console.log("Modified audience initialized from primary audience");
  }, [primaryAudience]);
  
  // Start editing and initialize the draft state
  const startEditing = () => {
    // Create a deep copy of the primary audience to avoid mutating the original
    setDraftAudience(JSON.parse(JSON.stringify(primaryAudience)));
    setIsEditing(true);
  };
  
  // Cancel editing and discard changes
  const cancelEditing = () => {
    setIsEditing(false);
    setDraftAudience(null);
  };
  
  // Apply changes and close the edit panel
  const applyChanges = () => {
    console.log('Changes would be applied here', draftAudience);
    // The actual implementation would update the original audience
    // and recalculate metrics, but for now we just log and close
    setIsEditing(false);
    setDraftAudience(null);
  };
  
  // Update a specific filter in the draft audience
  const updateDraftFilter = (filterKey: keyof AudienceConfig['filters'], value: any) => {
    if (!draftAudience) return;
    
    setDraftAudience({
      ...draftAudience,
      filters: {
        ...draftAudience.filters,
        [filterKey]: value
      }
    });
  };
  
  // Function to calculate provider metrics based on audience filters
  const calculateAudienceMetrics = (filters: AudienceConfig['filters']) => {
    console.log("Calculating metrics for filters:", filters);
    
    // Start with a default count - this mimics the logic from ExploreDatabase
    let baseCount = 4500;
    
    // Only apply filters if any selections are made
    const hasAnySelections = filters.medicationCategory || 
                            filters.medications.length > 0 || 
                            filters.specialties.length > 0 || 
                            filters.regions.length > 0 || 
                            filters.prescribingVolume !== 'all' ||
                            filters.excludedMedications.length > 0;
    
    if (hasAnySelections) {
      // Apply medication filters
      if (filters.medications.length > 0) {
        baseCount = Math.floor(baseCount * 0.7);
      } else if (filters.medicationCategory) {
        baseCount = Math.floor(baseCount * 0.85);
      }
      
      // Apply specialty filters
      if (filters.specialties.length > 0) {
        baseCount = Math.floor(baseCount * (0.4 + 0.1 * filters.specialties.length));
      }
      
      // Apply geographic filters
      if (filters.regions.length > 0) {
        baseCount = Math.floor(baseCount * (0.3 + 0.15 * filters.regions.length));
      }
      
      // Apply prescribing volume filter
      if (filters.prescribingVolume !== 'all') {
        const volumeMultipliers: Record<string, number> = {
          high: 0.3,
          medium: 0.5,
          low: 0.7
        };
        baseCount = Math.floor(baseCount * (volumeMultipliers[filters.prescribingVolume] || 1));
      }
      
      // Apply excluded medications logic
      if (filters.excludedMedications.length > 0) {
        const excludedMedsAdjustment = 0.7 - (0.05 * filters.excludedMedications.length);
        baseCount = Math.floor(baseCount * excludedMedsAdjustment);
      }
    }
    
    // Calculate provider count and potential reach
    const providerCount = baseCount;
    const potentialReach = baseCount * 250; // Each provider reaches ~250 patients
    
    console.log(`Calculated metrics: ${providerCount} providers, ${potentialReach} potential reach`);
    
    return {
      providerCount,
      potentialReach
    };
  };
  
  // Function to update a filter in the modified audience
  const updateModifiedFilter = (filterKey: keyof AudienceConfig['filters'], value: any) => {
    if (!modifiedAudience) return;
    
    // Create updated audience with new filter value
    const updatedAudience = {
      ...modifiedAudience,
      filters: {
        ...modifiedAudience.filters,
        [filterKey]: value
      }
    };
    
    // Update the modified audience state
    setModifiedAudience(updatedAudience);
    
    // Calculate and update metrics
    const metrics = calculateAudienceMetrics(updatedAudience.filters);
    setModifiedMetrics(metrics);
  };
  
  // Calculate differences between audiences for key metrics
  const calculateDifferences = (): MetricDifference[] => {
    if (!modifiedMetrics || !modifiedAudience) {
      // Fall back to secondary audience if modified metrics aren't available yet
      return [
        {
          label: "Provider Count",
          primary: primaryAudience.providerCount,
          secondary: secondaryAudience.providerCount,
          difference: primaryAudience.providerCount - secondaryAudience.providerCount,
          percentChange: ((primaryAudience.providerCount - secondaryAudience.providerCount) / secondaryAudience.providerCount) * 100,
          isPositive: primaryAudience.providerCount > secondaryAudience.providerCount
        },
        {
          label: "Potential Reach",
          primary: primaryAudience.potentialReach,
          secondary: secondaryAudience.potentialReach,
          difference: primaryAudience.potentialReach - secondaryAudience.potentialReach,
          percentChange: ((primaryAudience.potentialReach - secondaryAudience.potentialReach) / secondaryAudience.potentialReach) * 100,
          isPositive: primaryAudience.potentialReach > secondaryAudience.potentialReach
        }
      ];
    }
    
    // Use modified audience metrics for the comparison
    const metrics: MetricDifference[] = [
      {
        label: "Provider Count",
        primary: primaryAudience.providerCount,
        secondary: modifiedMetrics.providerCount,
        difference: primaryAudience.providerCount - modifiedMetrics.providerCount,
        percentChange: ((primaryAudience.providerCount - modifiedMetrics.providerCount) / modifiedMetrics.providerCount) * 100,
        isPositive: primaryAudience.providerCount > modifiedMetrics.providerCount
      },
      {
        label: "Potential Reach",
        primary: primaryAudience.potentialReach,
        secondary: modifiedMetrics.potentialReach,
        difference: primaryAudience.potentialReach - modifiedMetrics.potentialReach,
        percentChange: ((primaryAudience.potentialReach - modifiedMetrics.potentialReach) / modifiedMetrics.potentialReach) * 100,
        isPositive: primaryAudience.potentialReach > modifiedMetrics.potentialReach
      }
    ];
    
    return metrics;
  };
  
  // Recalculate differences when modified metrics change
  const differences = calculateDifferences();
  
  // Format number with commas and sign
  const formatNumber = (num: number, addSign = false) => {
    const sign = addSign && num > 0 ? '+' : '';
    return `${sign}${num.toLocaleString()}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header with back button and title */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mr-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Audience Comparison</h2>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onSaveAudience(primaryAudience)}
            className="flex items-center"
          >
            Save Primary Audience
          </Button>
          <Button 
            variant="default"
            onClick={() => onPushToCampaign(primaryAudience)}
            className="flex items-center"
          >
            <Target className="mr-1 h-4 w-4" />
            Push to Campaign
          </Button>
        </div>
      </div>
      
      {/* Self-comparison mode banner */}
      {isSelfComparisonMode && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Edit className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What-If Analysis Mode</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You're viewing a single audience with editable variations. The original audience is on the left,
                  and you can modify parameters on the right to test different targeting scenarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Audience names and summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
          <div className="flex justify-between mb-3">
            <div>
              <h3 className="font-medium text-primary-700 text-lg">{primaryAudience.name}</h3>
              <p className="text-sm text-gray-600 mt-1">Original Audience</p>
            </div>
          </div>
          
          {/* Original audience parameters - read only */}
          <div className="space-y-4 mt-4 p-4 bg-primary-50 border border-primary-100 rounded-lg">
            <h4 className="font-medium text-primary-800 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Original Audience Parameters
            </h4>
            
            {/* Medication Category */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Medication Category
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800">
                {primaryAudience.filters.medicationCategory || "Any"}
              </div>
            </div>
            
            {/* Medications */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Included Medications
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800 min-h-[38px]">
                {primaryAudience.filters.medications.length > 0 
                  ? primaryAudience.filters.medications.join(", ")
                  : "None specified"}
              </div>
            </div>
            
            {/* Excluded Medications */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Excluded Medications
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800 min-h-[38px]">
                {primaryAudience.filters.excludedMedications.length > 0 
                  ? primaryAudience.filters.excludedMedications.join(", ")
                  : "None specified"}
              </div>
            </div>
            
            {/* Provider Specialties */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Provider Specialties
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800 min-h-[38px]">
                {primaryAudience.filters.specialties.length > 0 
                  ? primaryAudience.filters.specialties.join(", ")
                  : "All specialties"}
              </div>
            </div>
            
            {/* Geographic Regions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Geographic Regions
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800 min-h-[38px]">
                {primaryAudience.filters.regions.length > 0 
                  ? primaryAudience.filters.regions.join(", ")
                  : "Nationwide"}
              </div>
            </div>
            
            {/* Prescribing Volume */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prescribing Volume
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800">
                {primaryAudience.filters.prescribingVolume === 'all' 
                  ? 'All Volumes' 
                  : `${primaryAudience.filters.prescribingVolume.charAt(0).toUpperCase() + primaryAudience.filters.prescribingVolume.slice(1)} Volume`}
              </div>
            </div>
            
            {/* Analysis Timeframe */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Analysis Timeframe
              </label>
              <div className="p-2 bg-white rounded border border-primary-100 text-gray-800">
                {primaryAudience.filters.timeframe.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {modifiedAudience && (
            <>
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-700 text-lg">
                    {isSelfComparisonMode ? `${modifiedAudience.name} (Variation)` : modifiedAudience.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isSelfComparisonMode ? "What-If Scenario" : "Modified Audience"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset the modified audience to match the original audience
                      setModifiedAudience(JSON.parse(JSON.stringify(primaryAudience)));
                      setModifiedMetrics({
                        providerCount: primaryAudience.providerCount,
                        potentialReach: primaryAudience.potentialReach
                      });
                    }}
                    className="text-xs py-1 px-2 h-auto"
                  >
                    Reset
                  </Button>
                  <div className="text-blue-600 text-sm font-medium py-1 px-2 bg-blue-50 rounded flex items-center">
                    <Edit size={14} className="mr-1" /> Editable
                  </div>
                </div>
              </div>
              
              {/* Controls for modifying the audience */}
              <div className="space-y-4 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Modify Audience Parameters
                </h4>
                
                {/* Medication Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medication Category
                  </label>
                  <Select
                    id="modified-medicationCategory"
                    value={modifiedAudience.filters.medicationCategory}
                    onChange={(value) => updateModifiedFilter('medicationCategory', value)}
                    options={medicationCategoryOptions}
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {modifiedAudience.filters.medicationCategory !== primaryAudience.filters.medicationCategory && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from: {primaryAudience.filters.medicationCategory || "Any"}
                    </p>
                  )}
                </div>
                
                {/* Medications */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Included Medications
                  </label>
                  <MultiSelect
                    options={[
                      { value: 'med_1', label: 'Atorvastatin' },
                      { value: 'med_2', label: 'Lisinopril' },
                      { value: 'med_3', label: 'Metformin' },
                      { value: 'med_4', label: 'Amlodipine' },
                      { value: 'med_5', label: 'Simvastatin' },
                      { value: 'med_6', label: 'Losartan' },
                      { value: 'med_7', label: 'Albuterol' },
                      { value: 'med_8', label: 'Gabapentin' },
                    ]}
                    value={modifiedAudience.filters.medications}
                    onChange={(value: string[]) => updateModifiedFilter('medications', value)}
                    placeholder="Select medications to include"
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {JSON.stringify(modifiedAudience.filters.medications) !== JSON.stringify(primaryAudience.filters.medications) && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from original selection
                    </p>
                  )}
                </div>
                
                {/* Excluded Medications */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Excluded Medications
                  </label>
                  <MultiSelect
                    options={[
                      { value: 'med_1', label: 'Atorvastatin' },
                      { value: 'med_2', label: 'Lisinopril' },
                      { value: 'med_3', label: 'Metformin' },
                      { value: 'med_4', label: 'Amlodipine' },
                      { value: 'med_5', label: 'Simvastatin' },
                      { value: 'med_6', label: 'Losartan' },
                      { value: 'med_7', label: 'Albuterol' },
                      { value: 'med_8', label: 'Gabapentin' },
                    ]}
                    value={modifiedAudience.filters.excludedMedications}
                    onChange={(value: string[]) => updateModifiedFilter('excludedMedications', value)}
                    placeholder="Select medications to exclude"
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {JSON.stringify(modifiedAudience.filters.excludedMedications) !== JSON.stringify(primaryAudience.filters.excludedMedications) && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from original selection
                    </p>
                  )}
                </div>
                
                {/* Provider Specialties */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Provider Specialties
                  </label>
                  <MultiSelect
                    options={[
                      { value: 'spec_1', label: 'Cardiology' },
                      { value: 'spec_2', label: 'Endocrinology' },
                      { value: 'spec_3', label: 'Family Medicine' },
                      { value: 'spec_4', label: 'Internal Medicine' },
                      { value: 'spec_5', label: 'Neurology' },
                      { value: 'spec_6', label: 'Oncology' },
                      { value: 'spec_7', label: 'Pediatrics' },
                      { value: 'spec_8', label: 'Psychiatry' },
                    ]}
                    value={modifiedAudience.filters.specialties}
                    onChange={(value: string[]) => updateModifiedFilter('specialties', value)}
                    placeholder="Select target specialties"
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {JSON.stringify(modifiedAudience.filters.specialties) !== JSON.stringify(primaryAudience.filters.specialties) && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from original selection
                    </p>
                  )}
                </div>
                
                {/* Geographic Regions */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Geographic Regions
                  </label>
                  <MultiSelect
                    options={[
                      { value: 'reg_1', label: 'Northeast' },
                      { value: 'reg_2', label: 'Southeast' },
                      { value: 'reg_3', label: 'Midwest' },
                      { value: 'reg_4', label: 'Southwest' },
                      { value: 'reg_5', label: 'West' },
                    ]}
                    value={modifiedAudience.filters.regions}
                    onChange={(value: string[]) => updateModifiedFilter('regions', value)}
                    placeholder="Select target regions"
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {JSON.stringify(modifiedAudience.filters.regions) !== JSON.stringify(primaryAudience.filters.regions) && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from original selection
                    </p>
                  )}
                </div>
                
                {/* Prescribing Volume */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Prescribing Volume
                  </label>
                  <Select
                    id="modified-prescribingVolume"
                    value={modifiedAudience.filters.prescribingVolume}
                    onChange={(value) => updateModifiedFilter('prescribingVolume', value)}
                    options={[
                      { value: 'all', label: 'All Volumes' },
                      { value: 'high', label: 'High Volume' },
                      { value: 'medium', label: 'Medium Volume' },
                      { value: 'low', label: 'Low Volume' },
                    ]}
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {modifiedAudience.filters.prescribingVolume !== primaryAudience.filters.prescribingVolume && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from: {primaryAudience.filters.prescribingVolume === 'all' 
                        ? 'All Volumes' 
                        : `${primaryAudience.filters.prescribingVolume.charAt(0).toUpperCase() + primaryAudience.filters.prescribingVolume.slice(1)} Volume`}
                    </p>
                  )}
                </div>
                
                {/* Analysis Timeframe */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Analysis Timeframe
                  </label>
                  <Select
                    id="modified-timeframe"
                    value={modifiedAudience.filters.timeframe}
                    onChange={(value) => updateModifiedFilter('timeframe', value)}
                    options={[
                      { value: 'last_month', label: 'Last Month' },
                      { value: 'last_quarter', label: 'Last Quarter' },
                      { value: 'last_year', label: 'Last Year' },
                    ]}
                    className="w-full"
                  />
                  
                  {/* Show indicator if changed from original */}
                  {modifiedAudience.filters.timeframe !== primaryAudience.filters.timeframe && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      Changed from: {primaryAudience.filters.timeframe.replace('_', ' ')}
                    </p>
                  )}
                </div>

                {/* Save button for the modified audience */}
                {modifiedAudience && 
                  modifiedMetrics && 
                  (modifiedAudience.filters.medicationCategory !== primaryAudience.filters.medicationCategory ||
                   modifiedAudience.filters.prescribingVolume !== primaryAudience.filters.prescribingVolume ||
                   modifiedAudience.filters.timeframe !== primaryAudience.filters.timeframe ||
                   JSON.stringify(modifiedAudience.filters.medications) !== JSON.stringify(primaryAudience.filters.medications) ||
                   JSON.stringify(modifiedAudience.filters.excludedMedications) !== JSON.stringify(primaryAudience.filters.excludedMedications) ||
                   JSON.stringify(modifiedAudience.filters.specialties) !== JSON.stringify(primaryAudience.filters.specialties) ||
                   JSON.stringify(modifiedAudience.filters.regions) !== JSON.stringify(primaryAudience.filters.regions)) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (modifiedAudience) {
                        // Create a new audience object with new ID to save variations
                        const newAudience = {
                          ...modifiedAudience,
                          id: Date.now().toString(),
                          name: `${primaryAudience.name} (Modified)`,
                          providerCount: modifiedMetrics.providerCount,
                          potentialReach: modifiedMetrics.potentialReach
                        };
                        onSaveAudience(newAudience);
                      }
                    }}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Save Modified Audience
                  </Button>
                )}
                
                {/* Reset button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Reset the modified audience to match the original audience
                    setModifiedAudience(JSON.parse(JSON.stringify(primaryAudience)));
                    setModifiedMetrics({
                      providerCount: primaryAudience.providerCount,
                      potentialReach: primaryAudience.potentialReach
                    });
                  }}
                  className="w-full mt-2"
                >
                  Reset to Original
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Edit panel for primary audience */}
      {isEditing && draftAudience && (
        <div className="animate-slideDown bg-white p-4 rounded-lg shadow-sm border border-primary-100 border-l-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <Edit className="h-4 w-4 text-primary-500 mr-2" />
            Edit Primary Audience
          </h3>
          
          <div className="space-y-4">
            {/* Filter Controls Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medication Category Dropdown */}
              <div>
                <Select
                  id="medicationCategory"
                  label="Medication Category"
                  value={draftAudience.filters.medicationCategory}
                  onChange={(value) => updateDraftFilter('medicationCategory', value)}
                  options={medicationCategoryOptions}
                  className="w-full"
                />
                {draftAudience.filters.medicationCategory !== primaryAudience.filters.medicationCategory && (
                  <p className="mt-1 text-xs text-primary-600">
                    Changed from: {primaryAudience.filters.medicationCategory || "Any"}
                  </p>
                )}
              </div>
              
              {/* Additional filter controls would be added here */}
              {/* We'll add more controls in subsequent iterations */}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> Changes will be reflected in metrics after applying.
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={applyChanges}
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Metrics comparison */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity className="h-5 w-5 text-primary-500 mr-2" />
          Key Metrics Comparison
        </h3>
        
        <div className="space-y-4">
          {differences.map((diff, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">{diff.label}</span>
                <div className="flex items-center">
                  {diff.isPositive ? (
                    <ArrowUp className="h-4 w-4 text-success-500 mr-1" />
                  ) : diff.percentChange === 0 ? (
                    <Equal className="h-4 w-4 text-gray-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-danger-500 mr-1" />
                  )}
                  <span 
                    className={cn(
                      "font-medium",
                      diff.isPositive ? "text-success-700" : diff.percentChange === 0 ? "text-gray-600" : "text-danger-700"
                    )}
                  >
                    {formatNumber(diff.percentChange, true)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-2">
                <div>
                  <div className="text-sm text-gray-500">Primary</div>
                  <div className="text-lg font-bold text-primary-700">{formatNumber(diff.primary)}</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Comparison</div>
                    <div className="text-lg font-medium text-gray-800">{formatNumber(diff.secondary)}</div>
                  </div>
                  <div className="pl-4 border-l border-gray-200">
                    <div className="text-sm text-gray-500">Difference</div>
                    <div className={cn(
                      "font-medium",
                      diff.isPositive ? "text-success-700" : diff.difference === 0 ? "text-gray-600" : "text-danger-700"
                    )}>
                      {formatNumber(diff.difference, true)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Provider segments comparison */}
      <div className="grid grid-cols-2 gap-6">
        <EnhancedSegmentBreakdown
          segments={primaryAudience.segments}
          totalValue={primaryAudience.providerCount}
          title="Original Audience Segments"
          subtitle={`${primaryAudience.providerCount.toLocaleString()} total providers by specialty`}
          className="border border-primary-100"
          height={350}
        />
        
        <EnhancedSegmentBreakdown
          segments={modifiedAudience ? modifiedAudience.segments : secondaryAudience.segments}
          totalValue={modifiedMetrics ? modifiedMetrics.providerCount : secondaryAudience.providerCount}
          title="Modified Audience Segments"
          subtitle={`${(modifiedMetrics ? modifiedMetrics.providerCount : secondaryAudience.providerCount).toLocaleString()} total providers by specialty`}
          className="border border-blue-100"
          height={350}
        />
      </div>
      
      {/* Geographic comparison */}
      <div className="grid grid-cols-2 gap-6">
        <RegionalHeatMap
          regions={primaryAudience.regionData}
          totalProviders={primaryAudience.providerCount}
          title="Original Geographic Distribution"
          subtitle="Provider density by region"
          className="border border-primary-100"
        />
        
        <RegionalHeatMap
          regions={modifiedAudience ? modifiedAudience.regionData : secondaryAudience.regionData}
          totalProviders={modifiedMetrics ? modifiedMetrics.providerCount : secondaryAudience.providerCount}
          title="Modified Geographic Distribution" 
          subtitle="Provider density by region"
          className="border border-blue-100"
        />
      </div>
      
      {/* Audience configuration details */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-100">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <Users className="h-4 w-4 text-primary-500 mr-2" />
            Primary Audience Configuration
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Medication Category:</span>
              <span className="font-medium">{primaryAudience.filters.medicationCategory || "Any"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Target Specialties:</span>
              <span className="font-medium">{primaryAudience.filters.specialties.length > 0 
                ? primaryAudience.filters.specialties.join(", ") 
                : "All"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Prescribing Volume:</span>
              <span className="font-medium">{primaryAudience.filters.prescribingVolume}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Timeframe:</span>
              <span className="font-medium">{primaryAudience.filters.timeframe.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <Users className="h-4 w-4 text-blue-500 mr-2" />
            Modified Audience Configuration
          </h3>
          
          {modifiedAudience && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Medication Category:</span>
                <div className="flex items-center">
                  <span className={cn(
                    "font-medium",
                    modifiedAudience.filters.medicationCategory !== primaryAudience.filters.medicationCategory 
                      ? "text-blue-600" 
                      : "text-gray-800"
                  )}>
                    {modifiedAudience.filters.medicationCategory || "Any"}
                  </span>
                  
                  {modifiedAudience.filters.medicationCategory !== primaryAudience.filters.medicationCategory && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      Changed
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Target Specialties:</span>
                <span className="font-medium">{modifiedAudience.filters.specialties.length > 0 
                  ? modifiedAudience.filters.specialties.join(", ") 
                  : "All"}</span>
              </div>
              
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Prescribing Volume:</span>
                <span className="font-medium">{modifiedAudience.filters.prescribingVolume}</span>
              </div>
              
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Timeframe:</span>
                <span className="font-medium">{modifiedAudience.filters.timeframe.replace('_', ' ')}</span>
              </div>
              
              {/* Metrics summary */}
              {modifiedMetrics && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Provider Count:</span>
                    <span className="font-semibold text-blue-700">{modifiedMetrics.providerCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient Reach:</span>
                    <span className="font-semibold text-blue-700">{modifiedMetrics.potentialReach.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
