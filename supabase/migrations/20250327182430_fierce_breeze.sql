/*
  # Healthcare Marketing Platform Schema

  1. New Tables
    - providers
      - Anonymous provider data with specialties and geography
    - conditions
      - Medical conditions and associated treatments
    - medications
      - Medication information
    - campaigns
      - Marketing campaign data
    - campaign_results
      - Campaign performance metrics
    
  2. Security
    - RLS enabled on all tables
    - Policies for authenticated access only
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Providers table (anonymous data only)
CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty text NOT NULL,
  geographic_area text NOT NULL,
  practice_size text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Conditions table
CREATE TABLE conditions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Medications table
CREATE TABLE medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Campaigns table
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  target_condition_id uuid REFERENCES conditions(id),
  target_medication_id uuid REFERENCES medications(id),
  target_geographic_area text NOT NULL,
  target_specialty text NOT NULL,
  creative_content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Campaign results table
CREATE TABLE campaign_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns(id),
  metrics jsonb NOT NULL,
  report_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON providers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON conditions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON medications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON campaigns
  FOR ALL TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Allow authenticated read own results" ON campaign_results
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_results.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );