/*
  # Add reference data for healthcare marketing platform

  1. New Data
    - Sample conditions for common medical conditions
    - Sample medications across different categories
    - Geographic regions covering major areas
    - Medical specialties
    - Creative templates for campaign generation

  2. Security
    - Maintain existing RLS policies
*/

-- Insert sample conditions
INSERT INTO conditions (name, description) VALUES
  ('Type 2 Diabetes', 'A chronic condition affecting blood sugar regulation'),
  ('Hypertension', 'High blood pressure requiring management'),
  ('Depression', 'Major depressive disorder'),
  ('Asthma', 'Chronic respiratory condition'),
  ('Rheumatoid Arthritis', 'Autoimmune inflammatory joint condition'),
  ('COPD', 'Chronic obstructive pulmonary disease'),
  ('Anxiety Disorder', 'Generalized anxiety disorder'),
  ('Migraine', 'Chronic headache condition');

-- Insert sample medications
INSERT INTO medications (name, category, description) VALUES
  ('Metformin', 'Antidiabetic', 'First-line medication for type 2 diabetes'),
  ('Lisinopril', 'ACE Inhibitor', 'Treatment for hypertension and heart failure'),
  ('Sertraline', 'SSRI', 'Antidepressant medication'),
  ('Albuterol', 'Bronchodilator', 'Relief medication for asthma'),
  ('Adalimumab', 'Biologic', 'Treatment for rheumatoid arthritis'),
  ('Fluticasone', 'Corticosteroid', 'Anti-inflammatory for respiratory conditions'),
  ('Escitalopram', 'SSRI', 'Treatment for anxiety and depression'),
  ('Sumatriptan', 'Triptan', 'Acute treatment for migraines');

-- Insert geographic regions
INSERT INTO geographic_regions (name, type, population) VALUES
  ('Northeast US', 'Region', 55982803),
  ('Southeast US', 'Region', 97438243),
  ('Midwest US', 'Region', 68995685),
  ('Southwest US', 'Region', 40715163),
  ('West US', 'Region', 78588572),
  ('New York Metro', 'Metro', 19216182),
  ('Los Angeles Metro', 'Metro', 13200998),
  ('Chicago Metro', 'Metro', 9458539),
  ('Dallas Metro', 'Metro', 7637387),
  ('Houston Metro', 'Metro', 7122240);

-- Insert specialties
INSERT INTO specialties (name, description) VALUES
  ('Primary Care', 'General practice and family medicine'),
  ('Cardiology', 'Heart and cardiovascular system specialists'),
  ('Endocrinology', 'Hormone and metabolic disorder specialists'),
  ('Psychiatry', 'Mental health specialists'),
  ('Pulmonology', 'Respiratory system specialists'),
  ('Rheumatology', 'Joint and autoimmune disorder specialists'),
  ('Neurology', 'Nervous system specialists'),
  ('Internal Medicine', 'Complex medical condition specialists');

-- Insert creative templates
INSERT INTO creative_templates (name, description, template_type, headline_template, body_template, cta_template, variables) VALUES
  ('Clinical Efficacy', 
   'Highlights medication effectiveness for specific conditions',
   'standard',
   'Achieve {{efficacy_rate}}% symptom improvement with {{medication_name}}',
   'In clinical trials, {{medication_name}} demonstrated significant improvement in {{condition_name}} symptoms within {{timeframe}} weeks. {{statistic}}% of patients reported {{key_benefit}}.',
   'Learn how {{medication_name}} can help your patients with {{condition_name}}',
   '{"required": ["medication_name", "condition_name", "efficacy_rate", "timeframe", "statistic", "key_benefit"]}'
  ),
  ('Specialist Focus',
   'Targets specific medical specialties with relevant information',
   'specialty',
   'Attention {{specialty}} specialists: Transform {{condition_name}} treatment',
   'Join leading {{specialty}} specialists who have seen {{statistic}}% improvement in patient outcomes using {{medication_name}} for {{condition_name}}. {{key_benefit}} in just {{timeframe}} weeks.',
   'Discover the {{specialty}} advantage with {{medication_name}}',
   '{"required": ["specialty", "medication_name", "condition_name", "statistic", "key_benefit", "timeframe"]}'
  );