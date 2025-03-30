import React, { useState, useEffect } from 'react';
import { MedicationComparisonChart } from '../medications/MedicationComparisonChart';
import { TimeframeRange } from '../campaigns/TimeframeSelector';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { Select } from '../ui/Select';
import { 
  selectAllCampaigns, 
  selectCampaignsLoading,
  fetchCampaigns 
} from '../../store/slices/campaignSlice';
import {
  selectMedications,
  selectReferenceDataLoading,
  fetchAllReferenceData
} from '../../store/slices/referenceDataSlice';
import { Target, Pill, Filter } from 'lucide-react';

interface MedicationSectionProps {
  timeframe?: TimeframeRange;
  className?: string;
  initialCampaignId?: string;
  initialTargetMedicationId?: string;
}

export const MedicationSection: React.FC<MedicationSectionProps> = ({
  timeframe = { daysBefore: 30, daysAfter: 30 },
  className,
  initialCampaignId,
  initialTargetMedicationId
}) => {
  const dispatch = useAppDispatch();
  const campaigns = useAppSelector(selectAllCampaigns);
  const medications = useAppSelector(selectMedications);
  const campaignsLoading = useAppSelector(selectCampaignsLoading);
  const referenceDataLoading = useAppSelector(selectReferenceDataLoading);
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(initialCampaignId);
  const [selectedTargetMedicationId, setSelectedTargetMedicationId] = useState<string | undefined>(initialTargetMedicationId);
  
  // Fetch campaigns and reference data if not already loaded
  useEffect(() => {
    if (campaigns.length === 0 && !campaignsLoading) {
      dispatch(fetchCampaigns());
    }
    
    if (medications.length === 0 && !referenceDataLoading) {
      dispatch(fetchAllReferenceData());
    }
  }, [dispatch, campaigns.length, medications.length, campaignsLoading, referenceDataLoading]);

  // Get campaign options for select
  const getCampaignOptions = () => {
    if (campaignsLoading) {
      return [{ value: '', label: 'Loading campaigns...' }];
    }
    
    return [
      { value: '', label: 'All Campaigns' },
      ...campaigns.map(campaign => ({
        value: campaign.id,
        label: campaign.name
      }))
    ];
  };

  // Get medication options for select
  const getMedicationOptions = () => {
    if (referenceDataLoading) {
      return [{ value: '', label: 'Loading medications...' }];
    }
    
    return [
      { value: '', label: 'Select Target Medication' },
      ...medications.map(medication => ({
        value: medication.id,
        label: medication.name
      }))
    ];
  };
  
  // Find campaign target medication if a campaign is selected but no medication is explicitly selected
  useEffect(() => {
    if (selectedCampaignId && !selectedTargetMedicationId) {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign?.targeting_metadata?.medication) {
        setSelectedTargetMedicationId(campaign.targeting_metadata.medication);
      }
    }
  }, [selectedCampaignId, selectedTargetMedicationId, campaigns]);
  const handleCampaignChange = (value: string) => {
    setSelectedCampaignId(value || undefined);
  };

  const handleMedicationChange = (value: string) => {
    setSelectedTargetMedicationId(value || undefined);
  };

  return (
    <div className={className}>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Medication Market Analysis</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Compare medication performance and market share across regions
        </p>
      </div>
      
      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
        <div>
          <div className="flex items-center mb-1 sm:mb-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 mr-1 sm:mr-1.5" />
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Campaign
            </label>
          </div>
          <Select
            options={getCampaignOptions()}
            value={selectedCampaignId || ''}
            onChange={handleCampaignChange}
            className="w-full"
            disabled={campaignsLoading}
          />
          <p className="mt-1 text-2xs sm:text-xs text-gray-500 hidden sm:block">
            Filter analysis by specific campaign or view all data
          </p>
        </div>
        
        <div>
          <div className="flex items-center mb-1 sm:mb-2">
            <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 mr-1 sm:mr-1.5" />
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Target Medication
            </label>
          </div>
          <Select
            options={getMedicationOptions()}
            value={selectedTargetMedicationId || ''}
            onChange={handleMedicationChange}
            className="w-full"
            disabled={referenceDataLoading}
          />
          <p className="mt-1 text-2xs sm:text-xs text-gray-500 hidden sm:block">
            Select the primary medication to analyze
          </p>
        </div>
      </div>
      
      <MedicationComparisonChart 
        campaignId={selectedCampaignId}
        initialTargetMedication={selectedTargetMedicationId}
        initialTimeframe={timeframe}
        showRegionalAnalysis={true}
      />
    </div>
  );
};
