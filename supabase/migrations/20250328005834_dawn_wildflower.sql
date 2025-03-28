/*
  # Add detailed campaign metrics

  1. Changes
    - Add new metrics to campaign_results table:
      - engagement_metrics: detailed user interaction data
      - demographic_metrics: provider demographic breakdowns
      - roi_metrics: return on investment calculations
      - prescription_metrics: detailed prescription impact data
*/

-- Add new JSONB columns for detailed metrics
ALTER TABLE campaign_results
ADD COLUMN IF NOT EXISTS engagement_metrics jsonb NOT NULL DEFAULT '{
  "avg_time_on_page": 0,
  "bounce_rate": 0,
  "click_through_rate": 0,
  "social_shares": 0,
  "email_forwards": 0,
  "return_visits": 0,
  "resource_downloads": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS demographic_metrics jsonb NOT NULL DEFAULT '{
  "specialty_breakdown": {},
  "geographic_distribution": {},
  "practice_size_distribution": {},
  "years_of_experience_ranges": {},
  "patient_volume_ranges": {}
}'::jsonb,
ADD COLUMN IF NOT EXISTS roi_metrics jsonb NOT NULL DEFAULT '{
  "cost_per_impression": 0,
  "cost_per_click": 0,
  "cost_per_conversion": 0,
  "total_campaign_cost": 0,
  "estimated_revenue_impact": 0,
  "roi_percentage": 0,
  "lifetime_value_impact": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS prescription_metrics jsonb NOT NULL DEFAULT '{
  "total_prescription_change": 0,
  "new_prescriptions": 0,
  "prescription_renewals": 0,
  "market_share_change": 0,
  "patient_adherence_rate": 0,
  "prescription_by_specialty": {},
  "prescription_by_region": {},
  "average_prescription_value": 0
}'::jsonb;