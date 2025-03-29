import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { createCampaign } from '../../store/slices/campaignSlice';
import { fetchAllReferenceData } from '../../store/slices/referenceDataSlice';
import { generateAndStoreResults } from '../../store/slices/campaignResultsSlice';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
import { Input } from '../ui/Input';
import { addNotification } from '../../store/slices/uiSlice';
import { 
  Users, 
  Pill,
  MapPin,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  Zap,
  Check,
  Target,
  Settings,
  Cog
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Define the types for our targeting options - similar to ExploreDatabase
interface TargetingState {
  name: string; // Campaign name
  medicationCategory: string;
  medications: string[];
  excludedMedications: string[]; // Medications to explicitly exclude
  specialties: string[];
  regions: string[];
  prescribingVolume: 'all' | 'high' | 'medium' | 'low';
  timeframe: 'last_month' | 'last_quarter' | 'last_year';
  startDate: string; // Added field for start date
  endDate: string; // Added field for end date
}

// Create an IdentityMatch type for our progress tracking
interface IdentityMatchProgress {
  stage: 'not_started' | 'parsing' | 'matching' | 'analyzing' | 'complete';
  progress: number; // 0-100
  currentOperation?: string;
  results?: {
    matchedProviders: number;
    totalProviders: number;
    matchPercentage: number;
  };
  error?: string;
}

// Define initial targeting state
const initialTargetingState: TargetingState = {
  name: '',
  medicationCategory: '',
  medications: [],
  excludedMedications: [],
  specialties: [],
  regions: [],
  prescribingVolume: 'all',
  timeframe: 'last_quarter',
  startDate: '', // Initialize empty
  endDate: '' // Initialize empty
};

export function CampaignCreator(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth); // Get user from auth state
  
  // UI State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targeting, setTargeting] = useState<TargetingState>(initialTargetingState);
  
  // Provider Count State - Added for tracking
  const [providerCount, setProviderCount] = useState<number | null>(null);
  const [potentialReach, setPotentialReach] = useState<number | null>(null);
  const [identityMatch, setIdentityMatch] = useState<IdentityMatchProgress>({
    stage: 'not_started',
    progress: 0
  });
  
  // Popup State
  const [showMatchingPopup, setShowMatchingPopup] = useState<boolean>(false);
  
  // Data State
  const [availableMedicationCategories, setAvailableMedicationCategories] = useState<string[]>([]);
  const [availableMedications, setAvailableMedications] = useState<{id: string, name: string, category: string}[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<{id: string, name: string}[]>([]);
  const [availableRegions, setAvailableRegions] = useState<{id: string, name: string, type: string}[]>([]);
  
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
  
  // Load reference data and targeting filters when component mounts
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
        
        // Check if there's targeting data from ExploreDatabase
        const savedTargeting = localStorage.getItem('explorer_filters');
        if (savedTargeting) {
          try {
            const parsedTargeting = JSON.parse(savedTargeting);
            console.log('Loading targeting from ExploreDatabase:', parsedTargeting);
            
            // Update targeting state with saved data
            setTargeting(prev => ({
              ...prev,
              name: parsedTargeting.campaignName || '',
              medicationCategory: parsedTargeting.medicationCategory || '',
              medications: parsedTargeting.medications || [],
              excludedMedications: parsedTargeting.excludedMedications || [],
              specialties: parsedTargeting.specialties || [],
              regions: parsedTargeting.regions || [],
              prescribingVolume: parsedTargeting.prescribingVolume || 'all',
              timeframe: parsedTargeting.timeframe || 'last_quarter'
            }));
            
            // Check if we should skip to identity matching
            if (parsedTargeting.skipToIdentityMatching) {
              console.log('Skipping to identity matching step');
              setTimeout(() => {
                // Calculate provider counts first
                calculateProviderCounts();
                // Jump to step 4 (review step)
                setCurrentStep(4);
                // Then simulate clicking next to run identity matching
                setTimeout(() => {
                  runIdentityMatching();
                }, 500);
              }, 300);
            }
            
            // Remove saved targeting from localStorage
            localStorage.removeItem('explorer_filters');
          } catch (e) {
            console.error('Error parsing saved targeting:', e);
          }
        }
        
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
    !targeting.medicationCategory || med.category === targeting.medicationCategory
  );

  // Handle targeting changes
  const updateTargeting = (key: keyof TargetingState, value: any) => {
    setTargeting(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Calculate targeting provider counts whenever targeting changes
  useEffect(() => {
    // Only skip calculation on step 1
    if (currentStep < 2) {
      return;
    }
    
    // Always calculate counts when on step 2 or higher, regardless of selections
    calculateProviderCounts();
    
    // Add debugging to track when calculation happens
    console.log("Provider count calculation triggered, current step:", currentStep);
  }, [
    currentStep, // Add currentStep as dependency to recalculate when step changes
    targeting.medicationCategory, 
    targeting.medications, 
    targeting.excludedMedications, 
    targeting.specialties, 
    targeting.regions, 
    targeting.prescribingVolume
  ]);

  // Calculate provider counts based on targeting criteria
  const calculateProviderCounts = () => {
    console.log("Calculating provider counts with current targeting:", targeting);
    
    // Always start with a default count - ensures we always have a value
    let baseCount = 4500; // Start with the same base as ExploreDatabase
    
    // Only apply filters if any selections are made
    const hasAnySelections = targeting.medicationCategory || 
                             targeting.medications.length > 0 || 
                             targeting.specialties.length > 0 || 
                             targeting.regions.length > 0 || 
                             targeting.prescribingVolume !== 'all' ||
                             targeting.excludedMedications.length > 0;
    
    if (hasAnySelections) {
      // Apply medication filters
      if (targeting.medications.length > 0) {
        baseCount = Math.floor(baseCount * 0.7);
      } else if (targeting.medicationCategory) {
        baseCount = Math.floor(baseCount * 0.85);
      }
      
      // Apply specialty filters
      if (targeting.specialties.length > 0) {
        baseCount = Math.floor(baseCount * (0.4 + 0.1 * targeting.specialties.length));
      }
      
      // Apply geographic filters
      if (targeting.regions.length > 0) {
        baseCount = Math.floor(baseCount * (0.3 + 0.15 * targeting.regions.length));
      }
      
      // Apply prescribing volume filter
      if (targeting.prescribingVolume !== 'all') {
        const volumeMultipliers: Record<string, number> = {
          high: 0.3,
          medium: 0.5,
          low: 0.7
        };
        baseCount = Math.floor(baseCount * volumeMultipliers[targeting.prescribingVolume]);
      }
      
      // Apply excluded medications logic
      if (targeting.excludedMedications.length > 0) {
        const excludedMedsAdjustment = 0.7 - (0.05 * targeting.excludedMedications.length);
        baseCount = Math.floor(baseCount * excludedMedsAdjustment);
      }
    }
    
    // Always set provider count, even if there are no selections
    setProviderCount(baseCount);
    setPotentialReach(baseCount * 250); // Each provider reaches ~250 patients
    
    console.log(`Updated provider count: ${baseCount}, potential reach: ${baseCount * 250}`);
  };

  // Input validation for each step
  const validateCurrentStep = (): boolean => {
    setError(null); // Clear any existing errors
    
    switch(currentStep) {
      case 1:
        // First step validation - name, medication category, and dates
        if (!targeting.name) {
          setError('Campaign name is required');
          return false;
        }
        if (!targeting.startDate) {
          setError('Start date is required');
          return false;
        }
        if (!targeting.endDate) {
          setError('End date is required');
          return false;
        }
        if (!targeting.medicationCategory && targeting.medications.length === 0) {
          setError('Please select a medication category or specific medications');
          return false;
        }
        break;
      
      case 2:
        // Specialties are optional, so no validation needed here
        break;
        
      case 3:
        // Geographic targeting is optional too
        break;
        
      case 4:
        // Review step, ensure all required fields are present
        if (!targeting.name || !targeting.startDate || !targeting.endDate) {
          setError('Missing required campaign information');
          return false;
        }
        if (!targeting.medicationCategory && targeting.medications.length === 0) {
          setError('Please select a medication category or specific medications');
          return false;
        }
        break;
    }
    
    return true;
  };

  // Move to next step in the wizard
  const nextStep = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return; // Stop if validation fails
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      // Run identity matching before creating campaign
      runIdentityMatching();
    } else {
      createNewCampaign();
    }
  };
  
  // Identity matching process
  const runIdentityMatching = () => {
    console.log("Starting identity matching process");
    
    // Ensure provider count is calculated
    if (!providerCount) {
      calculateProviderCounts();
    }
    
    // Cache the current provider count to ensure consistency
    const currentProviderCount = providerCount || 1000;
    console.log(`Using provider count for identity matching: ${currentProviderCount}`);
    
    // Show the popup immediately
    setShowMatchingPopup(true);
    
    // Start with parsing stage
    setIdentityMatch({
      stage: 'parsing',
      progress: 10,
      currentOperation: 'Preparing provider data'
    });
    
    // Fast simulation of the stages to fit within 8 seconds
    setTimeout(() => {
      setIdentityMatch({
        stage: 'matching',
        progress: 30,
        currentOperation: 'Matching provider identities'
      });
      
      setTimeout(() => {
        setIdentityMatch({
          stage: 'analyzing',
          progress: 70,
          currentOperation: 'Analyzing provider data'
        });
        
        setTimeout(() => {
          // Complete the process with 98% match rate
          // Using the cached provider count to ensure it matches what was shown earlier
          setIdentityMatch({
            stage: 'complete',
            progress: 100,
            currentOperation: 'Providers successfully matched',
            results: {
              matchedProviders: Math.floor(currentProviderCount * 0.98),
              totalProviders: currentProviderCount,
              matchPercentage: 98
            }
          });
          
          // After 8 seconds total, close popup and advance to results
          setTimeout(() => {
            setShowMatchingPopup(false);
            setCurrentStep(5);
          }, 1000); // Short delay to show 100% complete
          
        }, 2500); // 2.5s for analyzing
      }, 2500); // 2.5s for matching
    }, 2000); // 2s for parsing
  };

  // Move to previous step in the wizard
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Reset targeting
  const resetTargeting = () => {
    setTargeting(initialTargetingState);
    setCurrentStep(1);
  };

  // Create the campaign after targeting is complete
  const createNewCampaign = async () => {
    console.log("createNewCampaign called");
    
    if (!targeting.name) {
      setError('Please provide a campaign name.');
      return;
    }

    if (!targeting.medicationCategory && targeting.medications.length === 0) {
      setError('Please select at least a medication category or specific medications.');
      return;
    }
    
    if (!targeting.startDate || !targeting.endDate) {
      setError('Campaign start and end dates are required.');
      return;
    }
    
    // Specialties are now optional
    
    if (!user?.id) {
      setError('User authentication required. Please log in again.');
      return;
    }
    
    if (identityMatch.stage !== 'complete') {
      console.error("Identity matching was not completed");
      setError('Identity matching must be completed before creating a campaign.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Find a medication in the selected category to use as target
      const targetMedication = targeting.medications.length > 0 
        ? availableMedications.find(med => med.id === targeting.medications[0])
        : availableMedications.find(med => med.category === targeting.medicationCategory);
      
      // Find specialty to use as target
      const targetSpecialty = targeting.specialties.length > 0
        ? availableSpecialties.find(spec => spec.id === targeting.specialties[0])?.name
        : undefined;
        
      // Find region to use as target area
      const targetRegion = targeting.regions.length > 0
        ? availableRegions.find(reg => reg.id === targeting.regions[0])?.name
        : undefined;
      
      // Create the campaign object with all required targeting
      const campaignData: any = {
        name: targeting.name,
        status: 'draft',
        created_at: new Date().toISOString(),
        created_by: user.id,
        targeting_logic: 'and',
        start_date: targeting.startDate,
        end_date: targeting.endDate
      };
      
      // Add targeting fields if available
      if (targetMedication?.id) {
        campaignData.target_medication_id = targetMedication.id;
      }
      
      if (targetSpecialty) {
        campaignData.target_specialty = targetSpecialty;
      }
      
      if (targetRegion) {
        campaignData.target_geographic_area = targetRegion;
      }
      
      // Store targeting information in metadata
      campaignData.targeting_metadata = {
        medicationCategory: targeting.medicationCategory,
        excluded_medications: targeting.excludedMedications,
        prescribing_volume: targeting.prescribingVolume,
        timeframe: targeting.timeframe
      };
      
      // Log the campaign object for debugging
      console.log('Campaign object to be created:', JSON.stringify(campaignData, null, 2));
      
      // Create the campaign in the database
      console.log('Dispatching createCampaign action');
      const result = await dispatch(createCampaign(campaignData));
      
      console.log('Campaign creation result:', result);
      
      // Check if the action was rejected
      if (result.type.endsWith('/rejected')) {
        console.error('Campaign creation failed:', result.payload);
        setError(`Campaign creation failed: ${result.payload || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Campaign created successfully!'
      }));
      
      // Store the campaign ID for highlighting in the list
      if (result.payload && typeof result.payload === 'object' && 'id' in result.payload) {
        const campaignId = String(result.payload.id);
        localStorage.setItem('newCampaignId', campaignId);
        
        // Once the campaign is created successfully, generate results data
        try {
          console.log('Generating results for new campaign:', campaignId);
          // Cast the result payload to Campaign type
          const createdCampaign = result.payload as any;
          await dispatch(generateAndStoreResults({
            campaign: createdCampaign,
            medications: medications
          }));
          
          console.log('Campaign results generated successfully');
        } catch (resultsError) {
          // Log error but don't block campaign creation flow
          console.error('Error generating campaign results:', resultsError);
        }
      }
      
      // Navigate to campaigns list
      navigate('/campaigns');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      
      console.error('Error creating campaign:', error);
      
      // Provide more specific error message if possible
      const errorMessage = error.message || 'Failed to create campaign';
      
      // Check for specific error types and provide more helpful messages
      if (error.message?.includes('400')) {
        setError('Bad request: The campaign data format is incorrect. Please check required fields.');
      } else if (error.message?.includes('401')) {
        setError('Authentication error: Please log in again.');
      } else if (error.message?.includes('403')) {
        setError('Permission denied: You do not have permission to create campaigns.');
      } else if (error.message?.includes('409')) {
        setError('Conflict: A campaign with this name may already exist.');
      } else if (error.message?.includes('500')) {
        setError('Server error: There was a problem on the server. Please try again later.');
      } else {
        setError(`Failed to create campaign: ${errorMessage}`);
      }
      
      setIsLoading(false);
    }
  };

  // Render the provider count summary - show on every step after step 1
  const renderProviderCounts = () => {
    // Don't show any counts on step 1
    if (currentStep === 1) return null;
    
    // We should always have a provider count now, but just in case
    const count = providerCount || 4500;
    const reach = potentialReach || count * 250;
    
    return (
      <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
        <div className="flex justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500">Matching Providers:</span>
            <span className="ml-2 text-lg font-semibold text-primary-700">{count.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Potential Patient Reach:</span>
            <span className="ml-2 text-lg font-semibold text-primary-700">{reach.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render identity matching progress
  const renderIdentityMatching = () => {
    if (currentStep !== 5) return null;
    
    const getProgressColor = () => {
      if (identityMatch.stage === 'complete') return 'bg-green-500';
      return 'bg-primary-500';
    };
    
    const getStatusText = () => {
      switch (identityMatch.stage) {
        case 'parsing': return 'Preparing provider data...';
        case 'matching': return 'Matching provider identities...';
        case 'analyzing': return 'Analyzing provider database...';
        case 'complete': return 'Match complete';
        default: return 'Starting identity matching...';
      }
    };
    
    return (
      <div className="animate-fadeIn">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <Users className="inline-block mr-2 text-primary-500" size={20} />
          Provider Identity Matching
        </h3>
        
        <div className="space-y-4 mb-6">
          {/* Progress bar only, no status text */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full bg-green-500" 
                style={{ width: "100%" }}>
              </div>
            </div>
          </div>
          
          {identityMatch.stage === 'complete' && identityMatch.results && (
            <>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-green-800">Match Results</h4>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {identityMatch.results.matchPercentage}% Match Rate
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700">
                      {identityMatch.results.matchedProviders.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Matched Providers</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700">
                      {identityMatch.results.totalProviders.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Total Providers</div>
                  </div>
                </div>
                
                {/* Removed identity matching complete message as requested */}
              </div>
            </>
          )}
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
              Campaign Details
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name <span className="text-error-600">*</span>
                </label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter campaign name"
                  value={targeting.name}
                  onChange={(e) => updateTargeting('name', e.target.value)}
                  fullWidth
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-error-600">*</span>
                  </label>
                  <Input
                    type="date"
                    id="startDate"
                    value={targeting.startDate}
                    onChange={(e) => updateTargeting('startDate', e.target.value)}
                    fullWidth
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-error-600">*</span>
                  </label>
                  <Input
                    type="date"
                    id="endDate"
                    value={targeting.endDate}
                    min={targeting.startDate} // Prevent end date before start date
                    onChange={(e) => updateTargeting('endDate', e.target.value)}
                    fullWidth
                  />
                </div>
              </div>
            </div>
            
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
                  value={targeting.medicationCategory}
                  onChange={(val) => updateTargeting('medicationCategory', val)}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Selected: {targeting.medicationCategory || 'None'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Medications to Include (Optional)
                </label>
                <MultiSelect
                  options={filteredMedications.map(med => ({ value: med.id, label: med.name }))}
                  value={targeting.medications}
                  onChange={(val) => updateTargeting('medications', val)}
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
                  value={targeting.excludedMedications}
                  onChange={(val) => updateTargeting('excludedMedications', val)}
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
                  value={targeting.specialties}
                  onChange={(val) => updateTargeting('specialties', val)}
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
                      onClick={() => updateTargeting('prescribingVolume', volume as any)}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-md border",
                        targeting.prescribingVolume === volume
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
                  value={targeting.regions}
                  onChange={(val) => updateTargeting('regions', val)}
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
                      onClick={() => updateTargeting('timeframe', option.value as any)}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-md border",
                        targeting.timeframe === option.value
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
              Review Campaign Settings
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Campaign Details</h4>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">Campaign Name:</span>
                  <span className="font-medium text-gray-900">
                    {targeting.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">Campaign Duration:</span>
                  <span className="font-medium text-gray-900">
                    {targeting.startDate} to {targeting.endDate}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Targeting Criteria</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medication Category:</span>
                    <span className="font-medium text-gray-900" data-testid="selected-category">
                      {targeting.medicationCategory || 'Any'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Included Medications:</span>
                    <span className="font-medium text-gray-900">
                      {targeting.medications.length > 0
                        ? targeting.medications.map(id => 
                            availableMedications.find(m => m.id === id)?.name).join(', ')
                        : targeting.medicationCategory 
                            ? `All ${targeting.medicationCategory}` 
                            : 'All medications'}
                    </span>
                  </div>
                  
                  {targeting.excludedMedications.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Excluded Medications:</span>
                      <span className="font-medium text-error-700">
                        {targeting.excludedMedications.map(id => 
                          availableMedications.find(m => m.id === id)?.name).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider Specialties:</span>
                    <span className="font-medium text-gray-900">
                      {targeting.specialties.length > 0
                        ? targeting.specialties.map(id => 
                            availableSpecialties.find(s => s.id === id)?.name).join(', ')
                        : 'All specialties'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Regions:</span>
                    <span className="font-medium text-gray-900">
                      {targeting.regions.length > 0
                        ? targeting.regions.map(id => 
                            availableRegions.find(r => r.id === id)?.name).join(', ')
                        : 'Nationwide'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prescribing Volume:</span>
                    <span className="font-medium text-gray-900">
                      {targeting.prescribingVolume === 'all' 
                        ? 'All Volumes' 
                        : `${targeting.prescribingVolume.charAt(0).toUpperCase() + targeting.prescribingVolume.slice(1)} Volume`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Analysis Timeframe:</span>
                    <span className="font-medium text-gray-900">
                      {targeting.timeframe === 'last_month' 
                        ? 'Last Month' 
                        : targeting.timeframe === 'last_quarter' 
                          ? 'Last Quarter' 
                          : 'Last Year'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Blue info box removed as requested */}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="px-6 py-8 bg-white rounded-lg border border-gray-200 shadow-sm relative">
      {/* Enhanced Identity Matching Popup */}
      {showMatchingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl shadow-2xl p-8 w-[550px] relative overflow-hidden animate-fadeIn">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="absolute top-0 left-0 w-full h-full">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full bg-blue-400"
                    style={{
                      width: `${Math.random() * 8 + 2}px`,
                      height: `${Math.random() * 8 + 2}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.7,
                      animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                      animationDelay: `${Math.random() * 5}s`
                    }}
                  />
                ))}
              </div>
              
              {/* Network connection lines */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4338ca" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={i}
                    x1={`${Math.random() * 100}%`}
                    y1={`${Math.random() * 100}%`}
                    x2={`${Math.random() * 100}%`}
                    y2={`${Math.random() * 100}%`}
                    stroke="url(#line-gradient)"
                    strokeWidth="1"
                    style={{
                      animation: `pulse ${Math.random() * 4 + 3}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </svg>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
                <Users className="inline-block mr-3 text-blue-400" size={24} />
                Provider Identity Matching
              </h3>
              
              <div className="relative mb-8 rounded-lg p-8 bg-opacity-10 bg-white border border-blue-500 border-opacity-20 backdrop-blur-sm" 
                   style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
                
                {/* Horizontal row of gears that spans full width */}
                <div className="flex items-center justify-between h-48 relative w-full">
                  {/* First gear */}
                  <Cog className="h-32 w-32 animate-spin" 
                    style={{ 
                      animationDuration: '7s', 
                      color: '#ffd700', /* Gold */
                      filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8)) brightness(1.2) contrast(1.2)',
                      zIndex: 3,
                      transform: 'translateZ(0)'
                    }} />
                  
                  {/* Second gear - spins opposite direction */}
                  <Cog className="h-40 w-40 animate-spin" 
                    style={{ 
                      animationDuration: '8s',
                      animationDirection: 'reverse',
                      color: '#c0c0c0', /* Silver */
                      filter: 'drop-shadow(0 0 5px rgba(192, 192, 192, 0.8)) brightness(1.5) contrast(1.1)',
                      zIndex: 2,
                      transform: 'translateZ(0)'
                    }} />
                  
                  {/* Central large settings gear */}
                  <Settings className="h-48 w-48 animate-spin" 
                    style={{ 
                      animationDuration: '6s',
                      background: 'linear-gradient(135deg, #ffd700, #f5bc00)', /* Gold gradient */
                      borderRadius: '50%',
                      color: 'transparent',
                      WebkitBackgroundClip: 'text',
                      filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))',
                      zIndex: 4,
                      transform: 'translateZ(0)'
                    }} />
                  
                  {/* Fourth gear - spins opposite direction */}
                  <Cog className="h-36 w-36 animate-spin" 
                    style={{ 
                      animationDuration: '7.5s',
                      animationDirection: 'reverse',
                      background: 'linear-gradient(135deg, #c0c0c0, #e8e8e8)', /* Silver gradient */
                      borderRadius: '50%',
                      color: 'transparent',
                      WebkitBackgroundClip: 'text',
                      filter: 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.8))',
                      zIndex: 1,
                      transform: 'translateZ(0)'
                    }} />
                  
                  {/* Fifth gear */}
                  <Cog className="h-30 w-30 animate-spin" 
                    style={{ 
                      animationDuration: '6.5s',
                      color: '#FFD700', /* Gold */
                      filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8)) brightness(1.4)',
                      zIndex: 3,
                      transform: 'translateZ(0)'
                    }} />
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="mb-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-300">{identityMatch.stage === 'complete' ? 'Match process complete' : 'Processing provider data'}</span>
                  <span className="text-lg font-semibold text-blue-200">{identityMatch.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ 
                      width: `${identityMatch.progress}%`,
                      transition: 'width 0.5s ease-in-out',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                    }}>
                  </div>
                </div>
                
                {identityMatch.currentOperation && (
                  <p className="text-sm text-center font-medium text-blue-200 opacity-80">
                    {identityMatch.currentOperation}
                  </p>
                )}
              </div>
            </div>
            
            {/* Add keyframe animations */}
            <style>
              {`
                @keyframes pulse {
                  0%, 100% { opacity: 0.2; }
                  50% { opacity: 0.8; }
                }
                @keyframes float {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-20px); }
                  100% { transform: translateY(0px); }
                }
              `}
            </style>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Campaign</h2>
      
      {error && (
        <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-center">
          <span className="mr-2"><Check size={16} /></span>
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-pulse text-center">
            <div className="h-6 w-40 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mb-2 mx-auto"></div>
            <div className="h-4 w-56 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                  <div 
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border text-sm font-medium", 
                      currentStep >= step 
                        ? "border-primary-500 bg-primary-50 text-primary-700" 
                        : "border-gray-300 bg-white text-gray-500"
                    )}
                  >
                    {step}
                  </div>
                  
                  {step < 4 && (
                    <div 
                      className={cn(
                        "flex-1 h-0.5 mx-2", 
                        currentStep > step ? "bg-primary-500" : "bg-gray-200"
                      )}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <div>Campaign Details</div>
              <div>Providers</div>
              <div>Geography</div>
              <div>Review</div>
            </div>
          </div>
          
          {/* Display provider counts */}
          {renderProviderCounts()}
          
          {/* Display identity matching when in that step */}
          {currentStep === 5 ? renderIdentityMatching() : renderCurrentStep()}
          
          <div className="mt-8 flex justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={nextStep}
              variant="default"
              className="flex items-center"
            >
              {currentStep === 5 ? (
                <>
                  <Target className="mr-1 h-4 w-4" />
                  Create Campaign
                </>
              ) : currentStep === 4 ? (
                <>
                  <Users className="mr-1 h-4 w-4" />
                  Run Identity Matching
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
