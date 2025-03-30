import { PrescriptionData } from './prescription';

/**
 * Medication relationship types
 */
export type MedicationRelationshipType = 'target' | 'competitor' | 'unrelated';

/**
 * Represents a medication with its relationship to other medications
 */
export interface MedicationRelationship {
  id: string;
  name: string;
  relationship: MedicationRelationshipType;
  category: string;
  competitorIds?: string[]; // IDs of medications this competes with
}

/**
 * Market share metrics for medications
 */
export interface MedicationMarketMetrics {
  medicationId: string;
  medicationName: string;
  isTarget: boolean;
  isCompetitor: boolean;
  
  // Market share metrics
  marketShare: number;        // Current market share percentage
  marketShareBefore: number;  // Market share before campaign
  marketShareChange: number;  // Percentage point change
  competitiveIndex: number;   // Ratio of share vs average competitor
  marketRank: number;         // Position in market (1st, 2nd, etc.)
  
  // Prescription counts
  prescriptionCount: number;
  baselinePrescriptionCount: number;
  
  // Script lift
  scriptLift: number;         // Percentage change in prescriptions
}

/**
 * Geographic market share metrics
 */
export interface RegionalMarketMetrics {
  region: string;
  regionName: string;
  
  // Market metrics for target medication
  targetShare: number;
  targetShareChange: number;
  
  // Competitor metrics
  competitorShares: Map<string, number>;
  averageCompetitorShare: number;
  
  // Position metrics
  targetRank: number;
  shareGrowth: number;
  opportunity: number; // Calculated potential in region
  
  // Total metrics
  totalPrescriptions: number;
  targetPrescriptions: number;
  competitorPrescriptions: number;
}

/**
 * Overall market metrics summary
 */
export interface MarketMetricsSummary {
  // Target medication metrics
  targetId: string;
  targetName: string;
  targetOverallShare: number;
  targetShareChange: number;
  
  // Competitor metrics
  competitors: {
    id: string;
    name: string;
    share: number;
    shareChange: number;
  }[];
  
  // Regional metrics
  regionMetrics: RegionalMarketMetrics[];
  
  // Analysis metrics
  marketConcentration: number; // Herfindahl-Hirschman Index
  targetLeadingRegions: string[];
  targetWeakestRegions: string[];
  fastestGrowingRegions: string[];
}

/**
 * Parameters for medication comparison chart
 */
export interface MedicationComparisonParams {
  targetMedicationId?: string;
  competitorMedicationIds?: string[];
  timeframe?: {
    daysBefore: number;
    daysAfter: number;
  };
  regions?: string[];
  campaignId?: string; // Optional - if provided, will only use data from this campaign
}
