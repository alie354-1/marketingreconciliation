// Global Types for Healthcare Campaign Manager
import type {
  QueryField,
  QueryExpression,
  ComparisonExpression,
  LogicalExpression,
  FieldType,
  ComparisonOperator,
  LogicalOperator,
  FilterState as QueryFilterState,
  ValidationResult,
  SqlQueryResult
} from './query';

// Re-export all query types
export type {
  QueryField,
  QueryExpression,
  ComparisonExpression,
  LogicalExpression,
  FieldType,
  ComparisonOperator,
  LogicalOperator,
  ValidationResult,
  SqlQueryResult
};

// Auth types
export interface User {
  id: string;
  email: string;
  role?: string;
}

// Provider types
export interface Provider {
  id: string;
  specialty: string;
  geographic_area: string;
  practice_size: string;
  identity_matched?: boolean;
  identity_confidence?: number;
}

// Campaign related types
export interface Condition {
  id: string;
  name: string;
  description?: string;
}

export interface Medication {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface GeographicRegion {
  id: string;
  name: string;
  type: string;
  population?: number;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
}


export interface CreativeContent {
  headline: string;
  body: string;
  cta: string;
  image_url?: string;
}

export interface Campaign {
  id: string;
  name: string;
  target_condition_id?: string;
  target_medication_id?: string;
  target_geographic_area?: string;
  target_specialty?: string;
  // creative_content has been removed from database
  status: 'draft' | 'in_progress' | 'pending' | 'active' | 'completed' | 'paused';
  targeting_logic?: 'and' | 'or';
  targeting_metadata?: {
    excluded_medications?: string[];
    prescribing_volume?: 'all' | 'high' | 'medium' | 'low';
    timeframe?: 'last_month' | 'last_quarter' | 'last_year';
    affected_providers?: string[]; // IDs of providers affected by this campaign
    [key: string]: any;
  };
  start_date: string; // Now required
  end_date: string; // Now required
  created_by: string;
  created_at: string;
}

// Campaign metrics and results
export interface EngagementMetrics {
  avg_time_on_page: number;
  bounce_rate: number;
  return_visits: number;
  resource_downloads: number;
}

export interface DemographicMetrics {
  age_groups: Record<string, number>;
  genders: Record<string, number>;
}

export interface ROIMetrics {
  total_campaign_cost: number;
  roi_percentage: number;
  estimated_revenue_impact: number;
  cost_per_click: number;
  cost_per_conversion: number;
  cost_per_impression: number;
  lifetime_value_impact: number;
}

export interface PrescriptionMetrics {
  new_prescriptions: number;
  prescription_renewals: number;
  market_share_change: number;
  patient_adherence_rate: number;
  total_prescription_change: number;
  prescription_by_region: Record<string, number>;
  prescription_by_specialty: Record<string, number>;
}

export interface BasicMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface CampaignResult {
  id: string;
  campaign_id: string;
  metrics: BasicMetrics;
  engagement_metrics: EngagementMetrics;
  demographic_metrics: DemographicMetrics;
  roi_metrics: ROIMetrics;
  prescription_metrics: PrescriptionMetrics;
  report_date: string;
  created_at: string;
}

export interface QueryBuilderState {
  rootExpression: LogicalExpression;
  availableFields: QueryField[];
  errors: {[key: string]: string};
}

// UI/State types
export interface FilterState extends QueryFilterState {
  // Additional filter state props specific to our app
  queryExpression?: QueryExpression;
}

export interface TargetingCount {
  total: number;
  filtered: number;
  identityMatched: number;
  breakdown?: {
    bySpecialty?: Record<string, number>;
    byRegion?: Record<string, number>;
    byCondition?: Record<string, number>;
    byMedication?: Record<string, number>;
  };
}

export interface AlertNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Identity Match Process Types
export interface IdentityMatchProgress {
  stage: 'not_started' | 'parsing' | 'matching' | 'analyzing' | 'complete';
  progress: number; // 0-100
  currentOperation?: string;
  results?: IdentityMatchResults;
  error?: string;
}

export interface IdentityMatchResults {
  totalProviders: number;
  matchedProviders: number;
  matchPercentage: number;
  confidenceScores: {
    high: number;
    medium: number;
    low: number;
  };
  breakdownByCategories: {
    specialty?: Record<string, number>;
    region?: Record<string, number>;
    prescribingHistory?: Record<string, number>;
  };
}

// Script Lift Analysis Types
export interface ScriptLiftAnalysis {
  medication: {
    id: string;
    name: string;
  };
  baseline: number;
  projected: number;
  liftPercentage: number;
  confidenceScore: number;
  timePeriod: string;
  comparisonData?: Array<{
    name: string;
    liftPercentage: number;
  }>;
}
