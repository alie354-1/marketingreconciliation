/*
  # Add comprehensive sample data

  1. Sample Data
    - Adds sample conditions, medications, specialties, and geographic regions
    - Creates providers with all possible combinations
    - Adds creative templates for campaign generation

  2. Changes
    - Cleans existing data to ensure consistency
    - Adds comprehensive provider coverage
*/

-- Clean existing data
TRUNCATE conditions, medications, specialties, geographic_regions, providers, creative_templates CASCADE;

-- Add conditions
INSERT INTO conditions (name, description) VALUES
('Diabetes', 'Type 2 diabetes management'),
('Hypertension', 'High blood pressure treatment'),
('Asthma', 'Respiratory condition management');

-- Add medications
INSERT INTO medications (name, category, description) VALUES
('Metformin', 'Diabetes', 'First-line medication for type 2 diabetes'),
('Lisinopril', 'Hypertension', 'ACE inhibitor for blood pressure control'),
('Albuterol', 'Respiratory', 'Short-acting bronchodilator for asthma');

-- Add specialties
INSERT INTO specialties (name, description) VALUES
('Primary Care', 'General medical care and preventive medicine'),
('Endocrinology', 'Hormone and metabolic disorder specialists'),
('Cardiology', 'Heart and cardiovascular system specialists'),
('Pulmonology', 'Respiratory system specialists');

-- Add geographic regions
INSERT INTO geographic_regions (name, type, population) VALUES
('New York City', 'Metropolitan', 8400000),
('Los Angeles', 'Metropolitan', 4000000),
('Chicago', 'Metropolitan', 2700000),
('Houston', 'Metropolitan', 2300000);

-- Add creative templates
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
  'Clinical Efficacy',
  'Highlights medication efficacy for specific conditions',
  'medication',
  '{{medication_name}}: {{efficacy_rate}}% Effective for {{condition_name}}',
  'Clinical studies show {{medication_name}} demonstrates {{efficacy_rate}}% effectiveness in treating {{condition_name}} over {{timeframe}} weeks. {{key_benefit}}.',
  'Learn more about {{medication_name}}',
  '{"required": ["medication_name", "condition_name", "efficacy_rate", "timeframe", "key_benefit"]}'
);

-- Create providers with all possible combinations
WITH specialties_data AS (
  SELECT name as specialty FROM specialties
),
regions_data AS (
  SELECT name as area FROM geographic_regions
),
conditions_data AS (
  SELECT id as condition_id FROM conditions
),
medications_data AS (
  SELECT id as medication_id FROM medications
),
practice_sizes AS (
  SELECT unnest(ARRAY['Small', 'Medium', 'Large']) as practice_size
),
combinations AS (
  SELECT 
    s.specialty,
    r.area,
    c.condition_id,
    m.medication_id,
    p.practice_size
  FROM specialties_data s
  CROSS JOIN regions_data r
  CROSS JOIN conditions_data c
  CROSS JOIN medications_data m
  CROSS JOIN practice_sizes p
)
INSERT INTO providers (
  specialty,
  geographic_area,
  condition_id,
  medication_id,
  practice_size
)
SELECT 
  specialty,
  area,
  condition_id,
  medication_id,
  practice_size
FROM combinations;