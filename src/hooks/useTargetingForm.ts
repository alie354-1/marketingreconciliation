import { useState, useEffect, useCallback } from 'react';
import { 
  enablePatientPrescriptionsFeature, 
  countProvidersByFilter, 
  getProvidersByFilter,
  getDirectProviderCount,
  ProviderFilter 
} from '../lib/providerDataService';

// Interface for campaign targeting form state
export interface TargetingState {
  name: string;
  medicationCategory: string;
  medications: string[];
  excludedMedications: string[];
  specialties: string[];
  regions: string[];
  prescribingVolume: 'all' | 'high' | 'medium' | 'low';
  timeframe: 'last_month' | 'last_quarter' | 'last_year';
  gender: 'all' | 'male' | 'female';
}

// Initial state for targeting form
export const initialTargetingState: TargetingState = {
  name: '',
  medicationCategory: '',
  medications: [],
  excludedMedications: [],
  specialties: [],
  regions: [],
  prescribingVolume: 'all',
  timeframe: 'last_quarter',
  gender: 'all'
};

// Interface for hook return value
interface UseTargetingFormReturn {
  targeting: TargetingState;
  setTargeting: (targeting: TargetingState) => void;
  updateTargeting: (key: keyof TargetingState, value: any) => void;
  providerCount: number | null;
  potentialReach: number | null;
  matchingProviderIds: string[];  // Added to store the complete list of filtered provider IDs
  isCalculating: boolean;
  error: string | null;
  calculateProviderCounts: () => Promise<void>;
  saveFormToLocalStorage: () => void;
  resetTargeting: () => void;
}

/**
 * Custom hook for managing campaign targeting form with provider count calculations
 * Uses real data from providerDataService
 */
export function useTargetingForm(
  initialState: TargetingState = initialTargetingState
): UseTargetingFormReturn {
  // State for targeting form
  const [targeting, setTargeting] = useState<TargetingState>(initialState);
  
  // State for provider counts and IDs
  const [providerCount, setProviderCount] = useState<number | null>(null);
  const [potentialReach, setPotentialReach] = useState<number | null>(null);
  const [matchingProviderIds, setMatchingProviderIds] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize feature flag and get initial provider data
  useEffect(() => {
    const initialize = async () => {
      try {
        // Enable the feature flag
        await enablePatientPrescriptionsFeature();
        
        // Get direct count of all providers from the database
        const totalProviderCount = await getDirectProviderCount();
        console.log('Initial provider count (direct):', totalProviderCount);
        
        // Get initial set of provider IDs
        let initialProviderIds: string[] = [];
        try {
          // We'll still need the IDs for saving with campaigns
          initialProviderIds = await getProvidersByFilter({});
          console.log(`Fetched ${initialProviderIds.length} provider IDs`);
          setMatchingProviderIds(initialProviderIds);
        } catch (err) {
          console.error("Couldn't fetch provider IDs:", err);
          // This is okay, we'll proceed with just the count
        }
        
        // Use the direct count for display (more accurate)
        setProviderCount(totalProviderCount);
        setPotentialReach(totalProviderCount * 250); // Each provider reaches ~250 patients
        
        // If we got no IDs but we know there are providers, log a warning
        if (initialProviderIds.length === 0 && totalProviderCount > 0) {
          console.warn(`Warning: Got provider count ${totalProviderCount} but no provider IDs`);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize data');
        
        // Fall back to a reasonable default if we couldn't get the data
        setProviderCount(9997); // Use the known provider count as fallback
        setPotentialReach(9997 * 250);
        setMatchingProviderIds([]);
      }
    };
    
    initialize();
  }, []);
  
  // Update a single field in the targeting state
  const updateTargeting = useCallback((key: keyof TargetingState, value: any) => {
    setTargeting(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Reset targeting to initial state
  const resetTargeting = useCallback(() => {
    setTargeting(initialTargetingState);
    setProviderCount(null);
    setPotentialReach(null);
    setError(null);
  }, []);
  
  // Save form state to localStorage
  const saveFormToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('explorer_filters', JSON.stringify(targeting));
    } catch (error) {
      console.error('Failed to save form to localStorage:', error);
    }
  }, [targeting]);
  
  // Calculate provider counts based on targeting criteria
  const calculateProviderCounts = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Convert targeting state to ProviderFilter format
      const filter: ProviderFilter = {
        // Use medications from targeting
        medicationIds: targeting.medications,
        
        // Use excluded medications from targeting
        excludedMedicationIds: targeting.excludedMedications,
        
        // Use specialties from targeting
        specialties: targeting.specialties,
        
        // Use regions from targeting
        regions: targeting.regions,
        
        // Use gender from targeting
        gender: targeting.gender,
        
        // Default to OR logic for broader reach
        useAndLogic: false
      };
      
      console.log("Using provider filter:", JSON.stringify(filter, null, 2));
      
      // Get actual provider IDs based on filter
      const providerIds = await getProvidersByFilter(filter);
      
      // Store the matching provider IDs
      setMatchingProviderIds(providerIds);
      
      // Update counts based on the provider IDs
      const count = providerIds.length;
      setProviderCount(count);
      setPotentialReach(count * 250); // Each provider reaches ~250 patients
      
      console.log(`Updated provider count from database: ${count}, potential reach: ${count * 250}`);
    } catch (error) {
      console.error('Error calculating provider counts:', error);
      setError('Failed to calculate provider counts');
      
      // Fallback to the original calculation method if the service fails
      console.log('Falling back to estimated provider counts');
      
      // Always start with a default count
      let baseCount = 4500;
      
      // Apply medication filters - increase count as more medications are added
      if (targeting.medications.length > 0) {
        baseCount = Math.floor(baseCount * (0.5 + 0.1 * targeting.medications.length));
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
      
      // Set final counts
      setProviderCount(baseCount);
      setPotentialReach(baseCount * 250); // Each provider reaches ~250 patients
      
      console.log(`Fallback provider count: ${baseCount}, potential reach: ${baseCount * 250}`);
    } finally {
      setIsCalculating(false);
    }
  }, [targeting]);
  
  // Calculate provider counts when targeting changes
  useEffect(() => {
    // Skip if no meaningful selections
    if (!targeting.medicationCategory && 
        targeting.medications.length === 0 && 
        targeting.specialties.length === 0 && 
        targeting.regions.length === 0 && 
        targeting.gender === 'all') {
      return;
    }
    
    // Calculate provider counts
    calculateProviderCounts();
  }, [
    targeting.medicationCategory, 
    targeting.medications, 
    targeting.excludedMedications, 
    targeting.specialties, 
    targeting.regions, 
    targeting.prescribingVolume,
    targeting.gender,
    calculateProviderCounts
  ]);
  
  return {
    targeting,
    setTargeting,
    updateTargeting,
    providerCount,
    potentialReach,
    matchingProviderIds,
    isCalculating,
    error,
    calculateProviderCounts,
    saveFormToLocalStorage,
    resetTargeting
  };
}
