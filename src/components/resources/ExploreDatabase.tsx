import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchAllReferenceData } from '../../store/slices/referenceDataSlice';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
import { 
  Users, 
  Pill,
  MapPin,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  BarChart,
  PieChart,
  FileDown,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { RegionalHeatMap } from '../visualizations/RegionalHeatMap';
import { EnhancedSegmentBreakdown } from '../visualizations/EnhancedSegmentBreakdown';
import { AudienceComparisonView, AudienceConfig } from '../visualizations/AudienceComparisonView';

// Define the types for our filtering options
interface FilterState {
  medicationCategory: string;
  medications: string[];
  excludedMedications: string[];
  specialties: string[];
  regions: string[];
  prescribingVolume: 'all' | 'high' | 'medium' | 'low';
  timeframe: 'last_month' | 'last_quarter' | 'last_year';
}

// Define initial filter state
const initialFilterState: FilterState = {
  medicationCategory: '',
  medications: [],
  excludedMedications: [],
  specialties: [],
  regions: [],
  prescribingVolume: 'all',
  timeframe: 'last_quarter'
};

export function ExploreDatabase() {
  const dispatch = useAppDispatch();
  
  // UI State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsVisible, setResultsVisible] = useState<boolean>(false);
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'detailedAnalysis' | 'compare'>('overview');
  
  // Data State
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [availableMedicationCategories, setAvailableMedicationCategories] = useState<string[]>([]);
  const [availableMedications, setAvailableMedications] = useState<{id: string, name: string, category: string}[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<{id: string, name: string}[]>([]);
  const [availableRegions, setAvailableRegions] = useState<{id: string, name: string, type: string}[]>([]);
  
  // Results State
  const [providerCount, setProviderCount] = useState<number | null>(null);
  const [potentialReach, setPotentialReach] = useState<number | null>(null);
  
  // Visualization State
  const [regionData, setRegionData] = useState<{id: string, name: string, providerCount: number, percentage: number}[]>([]);
  const [specialtyData, setSpecialtyData] = useState<{id: string, name: string, value: number, percentage: number}[]>([]);
  const [volumeData, setVolumeData] = useState<{id: string, name: string, value: number, percentage: number}[]>([]);
  
  // Saved Audiences State
  interface SavedAudience {
    id: string;
    name: string;
    timestamp: string;
    filters: FilterState;
    providerCount: number;
    potentialReach: number;
    regionData: {id: string, name: string, providerCount: number, percentage: number}[];
    specialtyData: {id: string, name: string, value: number, percentage: number}[];
    volumeData: {id: string, name: string, value: number, percentage: number}[];
  }
  
  const [savedAudiences, setSavedAudiences] = useState<SavedAudience[]>([]);
  const [audienceName, setAudienceName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  
  // Audience comparison state
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  
  // Toggle audience selection for comparison
  const toggleAudienceSelection = (audienceId: string) => {
    setSelectedAudiences(prev => {
      if (prev.includes(audienceId)) {
        return prev.filter(id => id !== audienceId);
      } else {
        return [...prev, audienceId];
      }
    });
  };
  
  // Get selected audience objects
  const getSelectedAudienceObjects = () => {
    return savedAudiences.filter(audience => selectedAudiences.includes(audience.id));
  };

  // Get reference data from store
  const medications = useAppSelector(state => {
    const refData = state.referenceData as { medications: any[] };
    return refData.medications || [];
  });
  
  const specialties = useAppSelector(state => {
    const refData = state.referenceData as { specialties: any[] };
    return refData.specialties || [];
  });
  
  const regions = useAppSelector(state => {
    const refData = state.referenceData as { geographicRegions: any[] };
    return refData.geographicRegions || [];
  });

  // Load reference data when component mounts
  useEffect(() => {
    const loadReferenceData = async () => {
      setIsLoading(true);
      
      try {
        // Load reference data from Redux
        await dispatch(fetchAllReferenceData());
        
        // Load medication categories
        const categories = [...new Set(medications.map(med => med.category))];
        setAvailableMedicationCategories(categories);
        
        // Load medications
        setAvailableMedications(medications);
        
        // Load specialties
        setAvailableSpecialties(specialties);
        
        // Load regions
        setAvailableRegions(regions);
      } catch (err) {
        console.error('Error loading reference data:', err);
        setError('Unable to load necessary data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReferenceData();
  }, [dispatch, medications, specialties, regions]);

  // Filter medications based on selected category
  const filteredMedications = availableMedications.filter(med => 
    !filters.medicationCategory || med.category === filters.medicationCategory
  );

  // Handle filter changes
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Calculate provider counts based on targeting criteria
  useEffect(() => {
    // Only calculate counts when on step 2 or higher
    if (currentStep < 2) {
      return;
    }
    
    calculateProviderCounts();
  }, [
    currentStep,
    filters.medicationCategory, 
    filters.medications, 
    filters.excludedMedications, 
    filters.specialties, 
    filters.regions, 
    filters.prescribingVolume
  ]);

  // Calculate provider counts
  const calculateProviderCounts = () => {
    // Always start with a default count
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
        baseCount = Math.floor(baseCount * volumeMultipliers[filters.prescribingVolume]);
      }
      
      // Apply excluded medications logic
      if (filters.excludedMedications.length > 0) {
        const excludedMedsAdjustment = 0.7 - (0.05 * filters.excludedMedications.length);
        baseCount = Math.floor(baseCount * excludedMedsAdjustment);
      }
    }
    
    // Always set provider count, even if there are no selections
    setProviderCount(baseCount);
    setPotentialReach(baseCount * 250); // Each provider reaches ~250 patients
  };

  // Format data for visualizations
  const formatVisualizationData = () => {
    if (!providerCount) return;
    
    // Format region data
    let regionDataTemp: {id: string, name: string, providerCount: number, percentage: number}[] = [];
    
    // Use selected regions if any, otherwise use a default distribution
    if (filters.regions.length > 0) {
      // Create data based on selected regions
      const totalSelected = filters.regions.length;
      filters.regions.forEach((regionId, index) => {
        const region = availableRegions.find(r => r.id === regionId);
        if (region) {
          // Distribute provider count among selected regions
          // with some variation to make it look realistic
          const multiplier = 0.6 + (Math.random() * 0.8); // between 0.6 and 1.4
          const regionCount = Math.floor((providerCount / totalSelected) * multiplier);
          const percentage = Math.round((regionCount / providerCount) * 100);
          
          regionDataTemp.push({
            id: regionId,
            name: region.name,
            providerCount: regionCount,
            percentage
          });
        }
      });
    } else {
      // Create default region distribution
      const regionDistribution = [
        { id: 'northeast', name: 'Northeast', percent: 25 },
        { id: 'southeast', name: 'Southeast', percent: 30 },
        { id: 'midwest', name: 'Midwest', percent: 20 },
        { id: 'southwest', name: 'Southwest', percent: 15 },
        { id: 'west', name: 'West', percent: 10 }
      ];
      
      regionDataTemp = regionDistribution.map(region => ({
        id: region.id,
        name: region.name,
        providerCount: Math.floor((providerCount * region.percent) / 100),
        percentage: region.percent
      }));
    }
    
    // Format specialty data
    let specialtyDataTemp: {id: string, name: string, value: number, percentage: number}[] = [];
    
    // Use selected specialties if any, otherwise use a default distribution
    if (filters.specialties.length > 0) {
      // Create data based on selected specialties
      const totalSelected = filters.specialties.length;
      filters.specialties.forEach((specialtyId, index) => {
        const specialty = availableSpecialties.find(s => s.id === specialtyId);
        if (specialty) {
          // Distribute provider count among selected specialties
          const multiplier = 0.7 + (Math.random() * 0.6); // between 0.7 and 1.3
          const specialtyCount = Math.floor((providerCount / totalSelected) * multiplier);
          const percentage = Math.round((specialtyCount / providerCount) * 100);
          
          specialtyDataTemp.push({
            id: specialtyId,
            name: specialty.name,
            value: specialtyCount,
            percentage
          });
        }
      });
    } else {
      // Create default specialty distribution (top 5)
      const specialtyDistribution = availableSpecialties.slice(0, 5).map((specialty, index) => {
        const percentage = 30 - (index * 5); // 30%, 25%, 20%, 15%, 10%
        return {
          id: specialty.id,
          name: specialty.name,
          value: Math.floor((providerCount * percentage) / 100),
          percentage
        };
      });
      
      specialtyDataTemp = specialtyDistribution;
    }
    
    // Format volume data
    let volumeDataTemp: {id: string, name: string, value: number, percentage: number}[] = [];
    
    // Use selected volume if specified, otherwise use a default distribution
    if (filters.prescribingVolume !== 'all') {
      // For a specific volume selection, that volume gets 100%
      const volumeName = filters.prescribingVolume.charAt(0).toUpperCase() + filters.prescribingVolume.slice(1);
      volumeDataTemp = [{
        id: filters.prescribingVolume,
        name: `${volumeName} Volume`,
        value: providerCount,
        percentage: 100
      }];
    } else {
      // Default distribution for 'all' volumes
      const volumeDistribution = [
        { id: 'high', name: 'High Volume', percent: 25 },
        { id: 'medium', name: 'Medium Volume', percent: 50 },
        { id: 'low', name: 'Low Volume', percent: 25 }
      ];
      
      volumeDataTemp = volumeDistribution.map(volume => ({
        id: volume.id,
        name: volume.name,
        value: Math.floor((providerCount * volume.percent) / 100),
        percentage: volume.percent
      }));
    }
    
    // Update state with formatted data
    setRegionData(regionDataTemp);
    setSpecialtyData(specialtyDataTemp);
    setVolumeData(volumeDataTemp);
  };

  // Handle Analyze Audience button click
  const handleAnalyzeAudience = () => {
    if (!filters.medicationCategory && filters.medications.length === 0) {
      setError('Please select at least a medication category or specific medications.');
      return;
    }
    
    setIsLoading(true);
    calculateProviderCounts();
    
    // Simulate processing time
    setTimeout(() => {
      setIsLoading(false);
      
      // Format data for visualizations
      formatVisualizationData();
      
      // Set results as visible
      setResultsVisible(true);
    }, 1000);
  };

  // Move to next step in the wizard
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleAnalyzeAudience();
    }
  };

  // Move to previous step in the wizard
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Load saved audiences from localStorage
  useEffect(() => {
    const loadSavedAudiences = () => {
      const savedAudiencesString = localStorage.getItem('saved_audiences');
      if (savedAudiencesString) {
        try {
          const parsed = JSON.parse(savedAudiencesString);
          if (Array.isArray(parsed)) {
            setSavedAudiences(parsed);
          }
        } catch (err) {
          console.error('Error parsing saved audiences:', err);
        }
      }
    };
    
    loadSavedAudiences();
  }, []);

  // Save current audience
  const saveCurrentAudience = () => {
    if (!providerCount) return;
    
    // Generate a unique ID
    const id = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    // Create audience data
    const audienceData: SavedAudience = {
      id,
      name: audienceName || `Audience ${savedAudiences.length + 1}`,
      timestamp,
      filters: { ...filters },
      providerCount: providerCount,
      potentialReach: potentialReach || 0,
      regionData: [...regionData],
      specialtyData: [...specialtyData],
      volumeData: [...volumeData]
    };
    
    // Add to state
    const updatedAudiences = [...savedAudiences, audienceData];
    setSavedAudiences(updatedAudiences);
    
    // Save to local storage
    localStorage.setItem('saved_audiences', JSON.stringify(updatedAudiences));
    
    // Close modal and reset name
    setShowSaveModal(false);
    setAudienceName('');
    
    // Show success message
    alert('Audience saved successfully!');
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters(initialFilterState);
    setCurrentStep(1);
    setProviderCount(null);
    setPotentialReach(null);
  };
  
  // Exit the audience finder
  const exitAudienceFinder = () => {
    window.location.href = '/';
  };
  
  // Push to campaign
  const pushToCampaign = () => {
    // Store the filter info for CampaignCreator to pick up
    localStorage.setItem('explorer_filters', JSON.stringify({
      medicationCategory: filters.medicationCategory,
      medications: filters.medications,
      excludedMedications: filters.excludedMedications,
      specialties: filters.specialties,
      regions: filters.regions,
      prescribingVolume: filters.prescribingVolume,
      timeframe: filters.timeframe,
      skipToIdentityMatching: true
    }));
    
    // Navigate to campaign creator
    window.location.href = '/campaigns/create';
  };
  
  // Render the save audience modal
  const renderSaveModal = () => {
    if (!showSaveModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Current Audience</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audience Name
            </label>
            <input
              type="text"
              value={audienceName}
              onChange={(e) => setAudienceName(e.target.value)}
              placeholder={`Audience ${savedAudiences.length + 1}`}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </Button>
            
            <Button
              size="sm"
              onClick={saveCurrentAudience}
              disabled={!providerCount}
            >
              Save Audience
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render provider count summary
  const renderProviderCounts = () => {
    if (!providerCount && currentStep > 1) {
      return (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">
            Provider count will be calculated as you select targeting criteria
          </p>
        </div>
      );
    }
    
    if (!providerCount) return null;
    
    return (
      <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
        <div className="flex justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500">Matching Providers:</span>
            <span className="ml-2 text-lg font-semibold text-primary-700">{providerCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Potential Patient Reach:</span>
            <span className="ml-2 text-lg font-semibold text-primary-700">{potentialReach?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render steps based on current step
  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <Pill className="inline-block mr-2 text-primary-500" size={20} />
              Select Medications
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Category
                </label>
                <Select
                  options={[
                    { value: '', label: 'Select a Category' },
                    ...availableMedicationCategories.map(cat => ({ value: cat, label: cat }))
                  ]}
                  value={filters.medicationCategory}
                  onChange={(val) => updateFilter('medicationCategory', val)}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Selected: {filters.medicationCategory || 'None'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Medications to Include (Optional)
                </label>
                <MultiSelect
                  options={filteredMedications.map(med => ({ value: med.id, label: med.name }))}
                  value={filters.medications}
                  onChange={(val) => updateFilter('medications', val)}
                  isDisabled={filteredMedications.length === 0}
                  placeholder="Select medications to include"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Medications to Exclude (Optional)
                </label>
                <MultiSelect
                  options={filteredMedications.map(med => ({ value: med.id, label: med.name }))}
                  value={filters.excludedMedications}
                  onChange={(val) => updateFilter('excludedMedications', val)}
                  isDisabled={filteredMedications.length === 0}
                  placeholder="Select medications to exclude"
                  className="border-error-300 focus:border-error-500 bg-error-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These medications will be specifically excluded (useful for finding providers who prescribe competitors but not your product)
                </p>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <Users className="inline-block mr-2 text-primary-500" size={20} />
              Define Provider Criteria
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Specialties
                </label>
                <MultiSelect
                  options={availableSpecialties.map(specialty => ({ value: specialty.id, label: specialty.name }))}
                  value={filters.specialties}
                  onChange={(val) => updateFilter('specialties', val)}
                  placeholder="Select target specialties"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescribing Volume
                </label>
                <div className="flex space-x-2">
                  {['all', 'high', 'medium', 'low'].map(volume => (
                    <button
                      key={volume}
                      type="button"
                      onClick={() => updateFilter('prescribingVolume', volume as any)}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-md border",
                        filters.prescribingVolume === volume
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {volume === 'all' ? 'All Volumes' : `${volume.charAt(0).toUpperCase() + volume.slice(1)} Volume`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <MapPin className="inline-block mr-2 text-primary-500" size={20} />
              Geographic Targeting
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Regions
                </label>
                <MultiSelect
                  options={availableRegions.map(region => ({ 
                    value: region.id, 
                    label: `${region.name} (${region.type})` 
                  }))}
                  value={filters.regions}
                  onChange={(val) => updateFilter('regions', val)}
                  placeholder="Select target regions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Timeframe
                </label>
                <div className="flex space-x-2">
                  {[
                    { value: 'last_month', label: 'Last Month' },
                    { value: 'last_quarter', label: 'Last Quarter' },
                    { value: 'last_year', label: 'Last Year' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFilter('timeframe', option.value as any)}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-md border",
                        filters.timeframe === option.value
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <Filter className="inline-block mr-2 text-primary-500" size={20} />
              Results
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Criteria</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medication Category:</span>
                    <span className="font-medium text-gray-900" data-testid="selected-category">
                      {filters.medicationCategory || 'Any'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Included Medications:</span>
                    <span className="font-medium text-gray-900">
                      {filters.medications.length > 0
                        ? filters.medications.map(id => 
                            availableMedications.find(m => m.id === id)?.name).join(', ')
                        : filters.medicationCategory 
                            ? `All ${filters.medicationCategory}` 
                            : 'All medications'}
                    </span>
                  </div>
                  
                  {filters.excludedMedications.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Excluded Medications:</span>
                      <span className="font-medium text-error-700">
                        {filters.excludedMedications.map(id => 
                          availableMedications.find(m => m.id === id)?.name).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider Specialties:</span>
                    <span className="font-medium text-gray-900">
                      {filters.specialties.length > 0
                        ? filters.specialties.map(id => 
                            availableSpecialties.find(s => s.id === id)?.name).join(', ')
                        : 'All specialties'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Regions:</span>
                    <span className="font-medium text-gray-900">
                      {filters.regions.length > 0
                        ? filters.regions.map(id => 
                            availableRegions.find(r => r.id === id)?.name).join(', ')
                        : 'Nationwide'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prescribing Volume:</span>
                    <span className="font-medium text-gray-900">
                      {filters.prescribingVolume === 'all' 
                        ? 'All Volumes' 
                        : `${filters.prescribingVolume.charAt(0).toUpperCase() + filters.prescribingVolume.slice(1)} Volume`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Analysis Timeframe:</span>
                    <span className="font-medium text-gray-900">
                      {filters.timeframe === 'last_month' 
                        ? 'Last Month' 
                        : filters.timeframe === 'last_quarter' 
                          ? 'Last Quarter' 
                          : 'Last Year'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Search className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Ready to Analyze Your Audience</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Click "Analyze Audience" to process provider data based on your criteria.
                        This will identify the most relevant providers for your target medications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render results tabs
  const renderResultsTabs = () => {
    return (
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveResultTab('overview')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm flex items-center",
              activeResultTab === 'overview'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Activity size={18} className="mr-2" />
            Overview
          </button>
          
          <button
            onClick={() => setActiveResultTab('detailedAnalysis')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm flex items-center",
              activeResultTab === 'detailedAnalysis'
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <BarChart size={18} className="mr-2" />
            Detailed Analysis
          </button>
          
          <div className="relative group">
            <button
              disabled
              className="py-4 px-1 border-b-2 border-transparent text-gray-400 font-medium text-sm flex items-center cursor-not-allowed opacity-70"
            >
              <PieChart size={18} className="mr-2" />
              Compare
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Coming Soon
              </span>
            </button>
            <div className="absolute z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 text-sm bg-gray-900 text-white rounded shadow-lg transition-opacity duration-200 w-64">
              Compare audience segments to identify overlaps and differences between target demographics, prescribing behaviors, and geographic distribution
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </nav>
      </div>
    );
  };

  // Render the content for the Overview tab
  const renderOverviewTab = () => {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Audience Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <div className="text-sm text-gray-500 mb-1">Total Providers</div>
              <div className="text-3xl font-bold text-primary-700">{providerCount?.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-2">
                Based on your targeting criteria
              </div>
            </div>
            
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <div className="text-sm text-gray-500 mb-1">Potential Patient Reach</div>
              <div className="text-3xl font-bold text-primary-700">{potentialReach?.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-2">
                Estimated total patients
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Criteria</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-sm font-medium text-gray-500">Medication Category:</div>
                <div className="text-base text-gray-900">{filters.medicationCategory || 'Any'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Included Medications:</div>
                <div className="text-base text-gray-900">
                  {filters.medications.length > 0
                    ? filters.medications.map(id => 
                        availableMedications.find(m => m.id === id)?.name).join(', ')
                    : filters.medicationCategory 
                        ? `All ${filters.medicationCategory}` 
                        : 'All medications'}
                </div>
              </div>
              
              {filters.excludedMedications.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Excluded Medications:</div>
                  <div className="text-base text-error-600">
                    {filters.excludedMedications.map(id => 
                      availableMedications.find(m => m.id === id)?.name).join(', ')}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-500">Provider Specialties:</div>
                <div className="text-base text-gray-900">
                  {filters.specialties.length > 0
                    ? filters.specialties.map(id => 
                        availableSpecialties.find(s => s.id === id)?.name).join(', ')
                    : 'All specialties'}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Regions:</div>
                <div className="text-base text-gray-900">
                  {filters.regions.length > 0
                    ? filters.regions.map(id => 
                        availableRegions.find(r => r.id === id)?.name).join(', ')
                    : 'Nationwide'}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Prescribing Volume:</div>
                <div className="text-base text-gray-900">
                  {filters.prescribingVolume === 'all' 
                    ? 'All Volumes' 
                    : `${filters.prescribingVolume.charAt(0).toUpperCase() + filters.prescribingVolume.slice(1)} Volume`}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Analysis Timeframe:</div>
                <div className="text-base text-gray-900">
                  {filters.timeframe === 'last_month' 
                    ? 'Last Month' 
                    : filters.timeframe === 'last_quarter' 
                      ? 'Last Quarter' 
                      : 'Last Year'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResultsVisible(false);
              setCurrentStep(4);
            }}
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Edit
          </Button>
          
          <div className="relative group">
            <Button
              size="sm"
              disabled
              className="opacity-70 cursor-not-allowed"
            >
              <FileDown size={16} className="mr-1" />
              Export as PDF
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Coming Soon
              </span>
            </Button>
            <div className="absolute z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full mb-2 right-0 px-3 py-2 text-sm bg-gray-900 text-white rounded shadow-lg transition-opacity duration-200 w-64">
              PDF export functionality will be available in the next update
              <div className="absolute bottom-0 right-8 transform translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // State for showing detailed breakdowns
  const [showRegionBreakdown, setShowRegionBreakdown] = useState<boolean>(false);
  const [showSpecialtyBreakdown, setShowSpecialtyBreakdown] = useState<boolean>(false);
  const [showVolumeBreakdown, setShowVolumeBreakdown] = useState<boolean>(false);
  
  // Render the content for the Detailed Analysis tab
  const renderVisualizationsTab = () => {
    // If no data is available yet, show a placeholder
    if (!providerCount || regionData.length === 0 || specialtyData.length === 0) {
      return (
        <div className="animate-fadeIn">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Provider Distribution</h3>
            <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-gray-400">
                No visualization data available. Please try adjusting your filters.
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="animate-fadeIn space-y-6">
        {/* Regional Heat Map */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Geographic Distribution</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showRegionBreakdown"
                checked={showRegionBreakdown}
                onChange={() => setShowRegionBreakdown(!showRegionBreakdown)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <label htmlFor="showRegionBreakdown" className="text-sm text-gray-600">
                Show breakdown
              </label>
            </div>
          </div>
          <div className="mb-2 text-sm text-gray-500">
            Provider distribution across geographic regions
          </div>
          <RegionalHeatMap
            regions={regionData}
            totalProviders={providerCount}
            title="Provider Density by Region"
            subtitle={`Based on ${filters.timeframe.replace('_', ' ')} data`}
          />
          
          {showRegionBreakdown && (
            <div className="mt-4 overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regionData.map((region) => (
                    <tr key={region.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {region.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.providerCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Specialty Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Specialty Distribution</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showSpecialtyBreakdown"
                checked={showSpecialtyBreakdown}
                onChange={() => setShowSpecialtyBreakdown(!showSpecialtyBreakdown)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <label htmlFor="showSpecialtyBreakdown" className="text-sm text-gray-600">
                Show breakdown
              </label>
            </div>
          </div>
          <div className="mb-2 text-sm text-gray-500">
            Provider breakdown by medical specialty
          </div>
          <EnhancedSegmentBreakdown
            segments={specialtyData}
            totalValue={providerCount}
            title="Providers by Specialty"
            height={300}
          />
          
          {showSpecialtyBreakdown && (
            <div className="mt-4 overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialty
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {specialtyData.map((specialty) => (
                    <tr key={specialty.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {specialty.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {specialty.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {specialty.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Prescribing Volume Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Prescribing Volume</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showVolumeBreakdown"
                checked={showVolumeBreakdown}
                onChange={() => setShowVolumeBreakdown(!showVolumeBreakdown)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <label htmlFor="showVolumeBreakdown" className="text-sm text-gray-600">
                Show breakdown
              </label>
            </div>
          </div>
          <div className="mb-2 text-sm text-gray-500">
            Provider breakdown by prescribing volume
          </div>
          <EnhancedSegmentBreakdown
            segments={volumeData}
            totalValue={providerCount}
            title="Providers by Prescribing Volume"
            height={300}
          />
          
          {showVolumeBreakdown && (
            <div className="mt-4 overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {volumeData.map((volume) => (
                    <tr key={volume.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {volume.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volume.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volume.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Export and Back buttons */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveResultTab('overview');
            }}
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Overview
          </Button>
          
          <div className="relative group">
            <Button
              size="sm"
              disabled
              className="opacity-70 cursor-not-allowed"
            >
              <FileDown size={16} className="mr-1" />
              Export as PDF
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Coming Soon
              </span>
            </Button>
            <div className="absolute z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full mb-2 right-0 px-3 py-2 text-sm bg-gray-900 text-white rounded shadow-lg transition-opacity duration-200 w-64">
              PDF export functionality will be available in the next update
              <div className="absolute bottom-0 right-8 transform translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Load a saved audience
  const loadAudience = (audience: SavedAudience) => {
    setFilters({...audience.filters});
    setProviderCount(audience.providerCount);
    setPotentialReach(audience.potentialReach);
    setRegionData([...audience.regionData]);
    setSpecialtyData([...audience.specialtyData]);
    setVolumeData([...audience.volumeData]);
    
    setResultsVisible(true);
    setActiveResultTab('overview');
  };
  
  // Delete a saved audience
  const deleteAudience = (id: string) => {
    const updatedAudiences = savedAudiences.filter(audience => audience.id !== id);
    setSavedAudiences(updatedAudiences);
    localStorage.setItem('saved_audiences', JSON.stringify(updatedAudiences));
  };

  // Render the content for the Compare tab
  const renderCompareTab = () => {
    // If showing the comparison view, render that
    if (showComparison) {
      return renderComparisonView();
    }
    
    // If no saved audiences, show the empty state
    if (savedAudiences.length === 0) {
      return (
        <div className="animate-fadeIn">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Compare Audiences</h3>
            <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center text-gray-500">
                <p className="mb-4">No saved audiences available for comparison.</p>
                <p className="text-sm text-gray-400">Audience comparison feature coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Audiences</h3>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <PieChart className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Audience Comparison</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Select exactly 2 audiences to compare their provider distribution, geographic coverage, and targeting criteria.
                    This helps identify overlaps and differences between audience segments.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {selectedAudiences.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {selectedAudiences.length} audience{selectedAudiences.length !== 1 ? 's' : ''} selected
                {selectedAudiences.length > 2 && 
                  <span className="text-amber-600 ml-2">(maximum of 2 recommended for comparison)</span>
                }
              </div>
              <Button
                size="sm"
                disabled={selectedAudiences.length !== 2}
                onClick={() => setShowComparison(true)}
              >
                Compare Selected
              </Button>
            </div>
          )}
          
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Providers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialties
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savedAudiences.map((audience) => (
                  <tr 
                    key={audience.id} 
                    className={cn(
                      "hover:bg-gray-50",
                      selectedAudiences.includes(audience.id) ? "bg-primary-50" : ""
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAudiences.includes(audience.id)}
                        onChange={() => toggleAudienceSelection(audience.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{audience.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(audience.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{audience.providerCount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {audience.filters.specialties.length} specialties
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => loadAudience(audience)}
                        className="text-primary-600 hover:text-primary-900 mr-2"
                      >
                        Load
                      </button>
                      <button 
                        onClick={() => {
                          // Set single audience for comparison (self-comparison mode)
                          setSelectedAudiences([audience.id]);
                          setShowComparison(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Compare with Variations
                      </button>
                      <button 
                        onClick={() => deleteAudience(audience.id)}
                        className="text-error-600 hover:text-error-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the comparison view
  const renderComparisonView = () => {
    const selectedAudienceObjects = getSelectedAudienceObjects();
    
    // Self-comparison mode: If only one audience is selected, use it for both primary and secondary
    const isSelfComparisonMode = selectedAudienceObjects.length === 1;
    
    if (selectedAudienceObjects.length === 0) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Audience Comparison</h3>
          <div className="text-gray-600">
            Please select an audience to compare.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(false)}
            className="mt-4"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Audience Selection
          </Button>
        </div>
      );
    }
    
    // In self-comparison mode, the primary audience is used for both
    // In regular mode, we use both selected audiences
    let primaryAudience, secondaryAudience;
    
    if (isSelfComparisonMode) {
      primaryAudience = secondaryAudience = selectedAudienceObjects[0];
    } else {
      [primaryAudience, secondaryAudience] = selectedAudienceObjects;
    }
    
    // Convert SavedAudience to AudienceConfig format expected by AudienceComparisonView
    const formatAudienceForComparison = (audience: SavedAudience): AudienceConfig => {
      return {
        id: audience.id,
        name: audience.name,
        filters: {
          medicationCategory: audience.filters.medicationCategory,
          medications: audience.filters.medications,
          excludedMedications: audience.filters.excludedMedications,
          specialties: audience.filters.specialties,
          regions: audience.filters.regions,
          prescribingVolume: audience.filters.prescribingVolume,
          timeframe: audience.filters.timeframe
        },
        providerCount: audience.providerCount,
        potentialReach: audience.potentialReach,
        segments: audience.specialtyData,
        regionData: audience.regionData,
        dateCreated: audience.timestamp
      };
    };
    
    // Format audiences for the comparison component
    const primaryAudienceConfig = formatAudienceForComparison(primaryAudience);
    const secondaryAudienceConfig = formatAudienceForComparison(secondaryAudience);
    
    // Handlers for audience comparison component
    const handleBack = () => {
      setShowComparison(false);
    };
    
    const handlePushToCampaign = (audience: AudienceConfig) => {
      // Find the original audience using the ID
      const targetAudience = savedAudiences.find(a => a.id === audience.id);
      if (targetAudience) {
        // Apply audience filters and redirect to campaign creator
        setFilters(targetAudience.filters);
        
        // Store filters for the campaign creator
        localStorage.setItem('explorer_filters', JSON.stringify({
          medicationCategory: targetAudience.filters.medicationCategory,
          medications: targetAudience.filters.medications,
          excludedMedications: targetAudience.filters.excludedMedications,
          specialties: targetAudience.filters.specialties,
          regions: targetAudience.filters.regions,
          prescribingVolume: targetAudience.filters.prescribingVolume,
          timeframe: targetAudience.filters.timeframe,
          skipToIdentityMatching: true
        }));
        
        // Navigate to campaign creator
        window.location.href = '/campaigns/create';
      }
    };
    
    const handleSaveAudience = (audience: AudienceConfig) => {
      console.log('Saving modified audience:', audience);
      // Modified to handle the case where a modified audience is being saved
      if (audience.id === primaryAudienceConfig.id) {
        loadAudience(primaryAudience);
      } else {
        // Add logic to save the modified audience if needed
        // Cast the prescribingVolume and timeframe to the correct types
        const modifiedFilters: FilterState = {
          ...audience.filters,
          prescribingVolume: (audience.filters.prescribingVolume as 'all' | 'high' | 'medium' | 'low'),
          timeframe: (audience.filters.timeframe as 'last_month' | 'last_quarter' | 'last_year')
        };
        
        // Ensure all regionData items have a percentage property
        const regionDataWithPercentage = audience.regionData.map(region => ({
          ...region,
          percentage: region.percentage || 0 // Default to 0 if percentage is undefined
        }));
        
        const newAudience: SavedAudience = {
          id: Date.now().toString(), // New ID
          name: audience.name + " (Modified)",
          timestamp: new Date().toISOString(),
          filters: modifiedFilters,
          providerCount: audience.providerCount,
          potentialReach: audience.potentialReach,
          regionData: regionDataWithPercentage,
          specialtyData: audience.segments,
          volumeData: [] // Default
        };
        
        // Add to saved audiences
        const updatedAudiences = [...savedAudiences, newAudience];
        setSavedAudiences(updatedAudiences);
        localStorage.setItem('saved_audiences', JSON.stringify(updatedAudiences));
        
        // Exit comparison and return to audience list
        setShowComparison(false);
      }
    };
    
    return (
      <div className="animate-fadeIn">
        <AudienceComparisonView
          primaryAudience={primaryAudienceConfig}
          secondaryAudience={secondaryAudienceConfig}
          onBack={handleBack}
          onPushToCampaign={handlePushToCampaign}
          onSaveAudience={handleSaveAudience}
        />
      </div>
    );
  };

  // Render the content for the active tab
  const renderActiveTabContent = () => {
    switch (activeResultTab) {
      case 'overview':
        return renderOverviewTab();
      case 'detailedAnalysis':
        return renderVisualizationsTab();
      case 'compare':
        return renderCompareTab();
      default:
        return null;
    }
  };

  // Render main component UI
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-6xl mx-auto">
      {/* Save Audience Modal */}
      {renderSaveModal()}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Audience Explorer</h2>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
          >
            Reset
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exitAudienceFinder}
          >
            <ArrowLeft size={16} className="mr-1" />
            Exit
          </Button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-800 rounded-lg border border-error-200">
          {error}
        </div>
      )}
      
      {resultsVisible ? (
        // Results view
        <div>
          {/* Results tabs */}
          {renderResultsTabs()}
          
          {/* Active tab content */}
          {renderActiveTabContent()}
        </div>
      ) : (
        // Wizard steps view
        <>
          {/* Steps indicator */}
          <div className="mb-6">
            {/* Step circles with connecting lines */}
            <div className="flex items-center justify-between w-full relative">
              {/* Line connecting all circles - background */}
              <div className="absolute h-1 bg-gray-200 left-0 right-0 top-4 -translate-y-1/2"></div>
              
              {/* Lines showing progress */}
              <div 
                className="absolute h-1 bg-primary-200 left-0 top-4 -translate-y-1/2"
                style={{ 
                  width: `${(Math.min(currentStep - 1, 3) / 3) * 100}%` 
                }}
              ></div>
              
              {/* Step indicators */}
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="relative z-10">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step === currentStep
                        ? "bg-primary-600 text-white"
                        : step < currentStep
                          ? "bg-primary-200 text-primary-800"
                          : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {step}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Step labels */}
            <div className="flex mt-2 text-xs text-gray-500">
              <div className="w-1/4 text-left">Medications</div>
              <div className="w-1/4 text-center">Provider Criteria</div>
              <div className="w-1/4 text-center">Geographic Targeting</div>
              <div className="w-1/4 text-right">Results</div>
            </div>
          </div>
          
          {/* Provider count summary */}
          {renderProviderCounts()}
          
          {/* Current step content */}
          <div className="mb-6">
            {renderCurrentStep()}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
              ) : (
                <div />
              )}
            </div>
            
            <div>
              <Button
                onClick={nextStep}
                disabled={isLoading}
              >
                {currentStep === 4 ? (
                  <>Analyze Audience</>
                ) : (
                  <>Next <ChevronRight size={16} className="ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Processing your request...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
