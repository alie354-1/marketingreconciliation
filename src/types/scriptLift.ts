/**
 * Types for Script Lift Configurator
 */

// Medication configuration for script lift
export interface MedicationLiftConfig {
  id: string;
  name: string;
  category: string;
  baselinePrescriptions: number;
  liftPercentage: number;
  isTargeted: boolean;
  isCompetitor?: boolean;
}

// Provider specialty configuration
export interface SpecialtyLiftConfig {
  id: string;
  name: string;
  percentage: number;
}

// Geographic region configuration
export interface RegionLiftConfig {
  id: string;
  name: string;
  percentage: number;
}

// Overall campaign impact configuration
export interface CampaignImpactConfig {
  overallLiftPercentage: number;
  estimatedROI: number;
  marketShareChange: number;
  timeToImpact: number; // in weeks
}

// UI preferences for script lift comparison
export interface ScriptLiftPreferences {
  comparisonType?: string;
  timeframe?: {
    daysBefore: number;
    daysAfter: number;
  };
  selectedMedicationIds?: string[];
  comparisonMedicationId?: string | null;
  marketShareView?: 'charts' | 'table'; 
}

// Complete script lift configuration for a campaign
export interface ScriptLiftConfig {
  campaignId: string;
  campaignName: string;
  medications: MedicationLiftConfig[];
  specialties: SpecialtyLiftConfig[];
  regions: RegionLiftConfig[];
  campaignImpact: CampaignImpactConfig;
  createdAt: string;
  lastModified: string;
  notes?: string;
  preferences?: ScriptLiftPreferences;
}

// Store structure for holding all script lift configs
export interface ScriptLiftConfigStore {
  configs: Record<string, ScriptLiftConfig>; // keyed by campaignId
}
