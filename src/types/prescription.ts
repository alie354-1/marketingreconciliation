import { Campaign } from './index';

export interface PrescriptionData {
  id: string;
  campaign_id: string;
  medication_id: string;
  medication_name: string;
  medication_category: string;
  is_target: boolean; // Is this the target medication of the campaign?
  is_competitor: boolean; // Is this a competitor medication?
  
  // Provider demographics
  provider_id: string;
  provider_specialty: string;
  provider_region: string;
  
  // Prescription counts
  baseline_count: number; // Count before campaign
  current_count: number; // Count during/after campaign
  
  // Derived metrics
  change_count: number; // current_count - baseline_count
  change_percentage: number; // (change_count / baseline_count) * 100
  
  // Time periods
  baseline_period: string; // e.g., '2025-01-01_2025-02-01'
  current_period: string; // e.g., '2025-02-02_2025-03-02'
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Different grouping types for prescription data
export type PrescriptionGroupBy = 
  | 'medication' 
  | 'provider_specialty' 
  | 'provider_region'
  | 'medication_category';

// Prescription summary after grouping
export interface PrescriptionSummary {
  group_key: string; // The value of the field we grouped by
  group_name: string; // Human readable name
  baseline_total: number;
  current_total: number;
  change_count: number;
  change_percentage: number;
  records_count: number; // How many records were aggregated
}

/**
 * Configuration for generating prescription data
 */
export interface PrescriptionGenerationConfig {
  campaign: Campaign;
  targetMedicationId: string;
  targetMedicationName: string;
  competitorMedicationIds: string[];
  competitorMedicationNames: string[];
  medicationCategory: string;
  providerCount: number;
  targetLiftPercentage: number; // Expected lift for target medication
  competitorDeclinePercentage: number; // Expected decline for competitors
}
