/*
  # Add reference data for campaign targeting

  1. New Tables
    - `specialties`: Medical specialties that can be targeted
    - `geographic_regions`: Available geographic regions
    - `creative_templates`: Pre-defined templates for ad creative

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
*/

-- Specialties table
CREATE TABLE IF NOT EXISTS specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
  ON specialties
  FOR SELECT
  TO authenticated
  USING (true);

-- Geographic regions table
CREATE TABLE IF NOT EXISTS geographic_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- 'state', 'region', 'metropolitan_area'
  population integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE geographic_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
  ON geographic_regions
  FOR SELECT
  TO authenticated
  USING (true);

-- Creative templates table
CREATE TABLE IF NOT EXISTS creative_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_type text NOT NULL, -- 'awareness', 'conversion', 'reminder'
  headline_template text NOT NULL,
  body_template text NOT NULL,
  cta_template text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
  ON creative_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO specialties (name, description) VALUES
  ('Primary Care', 'General practitioners and family medicine'),
  ('Cardiology', 'Heart and cardiovascular system specialists'),
  ('Neurology', 'Brain and nervous system specialists'),
  ('Oncology', 'Cancer treatment specialists'),
  ('Psychiatry', 'Mental health specialists'),
  ('Pediatrics', 'Child health specialists'),
  ('Endocrinology', 'Hormone and metabolism specialists');

INSERT INTO geographic_regions (name, type, population) VALUES
  ('Northeast', 'region', 55982803),
  ('Midwest', 'region', 68995685),
  ('South', 'region', 126266107),
  ('West', 'region', 78588572),
  ('New York Metro', 'metropolitan_area', 20140470),
  ('Los Angeles Metro', 'metropolitan_area', 13200998),
  ('Chicago Metro', 'metropolitan_area', 9458539);

INSERT INTO creative_templates (
  name,
  description,
  template_type,
  headline_template,
  body_template,
  cta_template,
  variables
) VALUES
  (
    'New Treatment Option',
    'Introduce a new medication option for existing conditions',
    'awareness',
    'Introducing {{medication_name}}: A New Option for {{condition_name}} Treatment',
    'Help your patients with {{condition_name}} achieve better outcomes. {{medication_name}} has shown {{efficacy_rate}}% improvement in clinical trials.',
    'Learn more about {{medication_name}} today',
    '{"required": ["medication_name", "condition_name", "efficacy_rate"]}'
  ),
  (
    'Treatment Efficacy',
    'Highlight the effectiveness of a medication',
    'conversion',
    'Better {{condition_name}} Outcomes with {{medication_name}}',
    '{{statistic}}% of patients reported improved symptoms within {{timeframe}} weeks. Join other {{specialty}} physicians in providing better care.',
    'See the clinical data',
    '{"required": ["medication_name", "condition_name", "specialty", "statistic", "timeframe"]}'
  ),
  (
    'Patient Care Update',
    'Update on treatment guidelines or recommendations',
    'reminder',
    'Updated {{condition_name}} Treatment Guidelines',
    'New clinical evidence supports {{medication_name}} as a first-line treatment. {{key_benefit}} for your patients.',
    'Review the guidelines',
    '{"required": ["condition_name", "medication_name", "key_benefit"]}'
  );