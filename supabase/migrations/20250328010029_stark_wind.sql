/*
  # Add NPI Tracking and Media Engagement

  1. New Tables
    - provider_identifiers
      - Links NPIs with media identifiers
      - Stores matching confidence scores
      - Tracks data source and verification status
    
    - media_engagement_metrics
      - Real-time engagement tracking
      - Channel-specific metrics
      - Creative performance data
    
    - prescription_lift_data
      - Real-time script tracking
      - Pre/post campaign comparison
      - Market share impact

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated access
*/

-- Provider Identifiers Table
CREATE TABLE IF NOT EXISTS provider_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npi text NOT NULL,
  media_id text,
  provider_id uuid REFERENCES providers(id),
  match_confidence decimal DEFAULT 0,
  match_source text NOT NULL,
  verification_status text DEFAULT 'pending',
  verification_date timestamptz,
  last_sync_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE provider_identifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access for provider_identifiers"
  ON provider_identifiers
  FOR SELECT
  TO authenticated
  USING (true);

-- Media Engagement Metrics Table
CREATE TABLE IF NOT EXISTS media_engagement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id),
  campaign_id uuid REFERENCES campaigns(id),
  channel text NOT NULL,
  creative_variant text,
  impression_timestamp timestamptz DEFAULT now(),
  engagement_type text NOT NULL,
  engagement_duration interval,
  next_best_action text,
  personalization_factors jsonb DEFAULT '{}',
  engagement_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access for media_engagement_metrics"
  ON media_engagement_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Real-time Prescription Lift Data Table
CREATE TABLE IF NOT EXISTS prescription_lift_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id),
  campaign_id uuid REFERENCES campaigns(id),
  prescription_date timestamptz NOT NULL,
  medication_id uuid REFERENCES medications(id),
  script_type text NOT NULL,
  pre_campaign_baseline decimal,
  post_campaign_volume decimal,
  market_share_impact decimal,
  payer_mix jsonb DEFAULT '{}',
  patient_demographics jsonb DEFAULT '{}',
  verification_source text,
  data_confidence_score decimal DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescription_lift_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access for prescription_lift_data"
  ON prescription_lift_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Add new columns to providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS npi text,
ADD COLUMN IF NOT EXISTS identity_resolution_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_identity_check timestamptz,
ADD COLUMN IF NOT EXISTS identity_metadata jsonb DEFAULT '{}';

-- Add new columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS real_time_pld_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_provider text,
ADD COLUMN IF NOT EXISTS targeting_metadata jsonb DEFAULT '{
  "identity_resolution": {
    "provider": null,
    "confidence_threshold": 0.8,
    "fallback_strategy": "demographic",
    "update_frequency": "real-time"
  },
  "personalization": {
    "enabled": false,
    "rules": {},
    "next_best_action": {
      "enabled": false,
      "threshold": 0.7
    }
  }
}'::jsonb;