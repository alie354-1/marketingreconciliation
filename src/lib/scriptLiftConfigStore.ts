import { ScriptLiftConfig, ScriptLiftConfigStore } from '../types/scriptLift';

// LocalStorage key for storing script lift configurations
const STORAGE_KEY = 'script_lift_configs';

/**
 * Initialize the script lift config store
 * Creates an empty store if none exists
 */
function initializeStore(): ScriptLiftConfigStore {
  const existingStore = localStorage.getItem(STORAGE_KEY);
  if (existingStore) {
    try {
      return JSON.parse(existingStore);
    } catch (error) {
      console.error('Error parsing script lift configs:', error);
    }
  }
  
  // Return empty store if nothing exists or parsing failed
  return { configs: {} };
}

/**
 * Save the entire store back to localStorage
 */
function saveStore(store: ScriptLiftConfigStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Get all script lift configurations
 */
export function getAllScriptLiftConfigs(): ScriptLiftConfigStore {
  return initializeStore();
}

/**
 * Get a specific script lift configuration by campaign ID
 */
export function getScriptLiftConfig(campaignId: string): ScriptLiftConfig | null {
  const store = initializeStore();
  return store.configs[campaignId] || null;
}

/**
 * Save a script lift configuration
 * Updates or adds the configuration for the specified campaign
 */
export function saveScriptLiftConfig(config: ScriptLiftConfig): void {
  const store = initializeStore();
  
  // Update the lastModified timestamp
  const updatedConfig = {
    ...config,
    lastModified: new Date().toISOString()
  };
  
  // Save to store
  store.configs[config.campaignId] = updatedConfig;
  saveStore(store);
}

/**
 * Delete a script lift configuration
 */
export function deleteScriptLiftConfig(campaignId: string): void {
  const store = initializeStore();
  
  // Remove the config if it exists
  if (store.configs[campaignId]) {
    delete store.configs[campaignId];
    saveStore(store);
  }
}

/**
 * Generate default script lift configuration for a campaign
 * This creates a baseline using similar logic to the scriptLiftGenerator
 * but allows for user customization
 */
export function generateDefaultScriptLiftConfig(
  campaignId: string,
  campaignName: string,
  medications: any[], // Using any for now, can be typed more specifically
  targetMedicationId?: string,
  targetCategory?: string,
  specialties?: any[],
  regions?: any[]
): ScriptLiftConfig {
  // Find targeted medication or use first one in category as fallback
  const targetMedication = targetMedicationId
    ? medications.find(med => med.id === targetMedicationId)
    : (targetCategory ? medications.find(med => med.category === targetCategory) : null);
  
  // Use target category from medication or input
  const actualCategory = targetMedication?.category || targetCategory || 'general';
  
  // Get all medications in the target category and competitors
  const categoryMedications = medications.filter(med => med.category === actualCategory);
  const competitorMedications = medications.filter(med => med.category === 'competitors');
  
  // Create medication configurations with different default lift percentages
  const medicationConfigs: MedicationLiftConfig[] = [
    // Target category medications
    ...categoryMedications.map(med => ({
      id: med.id,
      name: med.name,
      category: med.category,
      baselinePrescriptions: Math.floor(Math.random() * 300) + 200, // Random baseline between 200-500
      liftPercentage: med.id === targetMedicationId ? 35 : 15, // Higher for direct target
      isTargeted: med.id === targetMedicationId
    })),
    
    // Competitors (if any)
    ...competitorMedications.map(med => ({
      id: med.id,
      name: med.name,
      category: med.category,
      baselinePrescriptions: Math.floor(Math.random() * 400) + 300, // Random baseline between 300-700
      liftPercentage: -8, // Default negative impact on competitors
      isTargeted: false,
      isCompetitor: true
    }))
  ];
  
  // Create specialty configurations (if provided)
  const specialtyConfigs: SpecialtyLiftConfig[] = specialties
    ? specialties.slice(0, 5).map((specialty, index) => ({
        id: specialty.id,
        name: specialty.name,
        percentage: 30 - (index * 5) // 30%, 25%, 20%, 15%, 10%
      }))
    : [
        { id: 'spec1', name: 'Primary Care', percentage: 30 },
        { id: 'spec2', name: 'Cardiology', percentage: 25 },
        { id: 'spec3', name: 'Neurology', percentage: 20 },
        { id: 'spec4', name: 'Endocrinology', percentage: 15 },
        { id: 'spec5', name: 'Other', percentage: 10 }
      ];
  
  // Create region configurations (if provided)
  const regionConfigs: RegionLiftConfig[] = regions
    ? regions.slice(0, 5).map((region, index) => ({
        id: region.id,
        name: region.name, 
        percentage: 30 - (index * 5) // 30%, 25%, 20%, 15%, 10%
      }))
    : [
        { id: 'reg1', name: 'Northeast', percentage: 30 },
        { id: 'reg2', name: 'Southeast', percentage: 25 },
        { id: 'reg3', name: 'Midwest', percentage: 20 },
        { id: 'reg4', name: 'Southwest', percentage: 15 },
        { id: 'reg5', name: 'West', percentage: 10 }
      ];
  
  // Create default campaign impact configuration
  const campaignImpact: CampaignImpactConfig = {
    overallLiftPercentage: 22.5,
    estimatedROI: 165,
    marketShareChange: 3.2,
    timeToImpact: 8 // 8 weeks
  };
  
  // Construct and return the complete configuration
  return {
    campaignId,
    campaignName,
    medications: medicationConfigs,
    specialties: specialtyConfigs,
    regions: regionConfigs,
    campaignImpact,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
}

// Import necessary types from the proper file
import { 
  MedicationLiftConfig, 
  SpecialtyLiftConfig, 
  RegionLiftConfig,
  CampaignImpactConfig
} from '../types/scriptLift';
