/*
  # Add provider relationships and sample data

  1. Changes
    - Add condition_id and medication_id columns to providers table
    - Create indexes for better query performance
    - Add sample conditions and medications
    - Update providers with condition and medication relationships

  2. Sample Data
    - Common medical conditions with valid UUIDs
    - Related medications with valid UUIDs
    - Provider relationships ensuring coverage across all combinations
*/

-- Add columns to providers table
ALTER TABLE providers 
ADD COLUMN condition_id uuid REFERENCES conditions(id),
ADD COLUMN medication_id uuid REFERENCES medications(id);

-- Create indexes for better performance
CREATE INDEX idx_providers_condition ON providers(condition_id);
CREATE INDEX idx_providers_medication ON providers(medication_id);
CREATE INDEX idx_providers_specialty ON providers(specialty);
CREATE INDEX idx_providers_geographic_area ON providers(geographic_area);

-- Insert sample conditions
INSERT INTO conditions (id, name, description) VALUES
  ('c1b6e124-4f52-4934-9dc1-3c4a65866b1a', 'Hypertension', 'High blood pressure condition requiring ongoing management'),
  ('c2f8e246-5f63-5a45-0ed2-4d5b76977c2b', 'Type 2 Diabetes', 'Metabolic disorder affecting blood sugar levels'),
  ('c3a9f357-6a74-6b56-1fe3-5e6c87088d3c', 'Asthma', 'Chronic respiratory condition with periodic breathing difficulties'),
  ('c4a0a468-7a85-7c67-2af4-6f7d98199e4d', 'Arthritis', 'Joint inflammation causing pain and stiffness');

-- Insert sample medications
INSERT INTO medications (id, name, category, description) VALUES
  ('d1a5d123-4e52-4934-9dc1-3c4a65866b1a', 'Lisinopril', 'ACE Inhibitor', 'Treatment for hypertension'),
  ('d2b6e234-5f63-5a45-0ed2-4d5b76977c2b', 'Metformin', 'Antidiabetic', 'First-line medication for type 2 diabetes'),
  ('d3c7f345-6a74-6b56-1fe3-5e6c87088d3c', 'Albuterol', 'Bronchodilator', 'Quick-relief medication for asthma'),
  ('d4d8a456-7a85-7c67-2af4-6f7d98199e4d', 'Ibuprofen', 'NSAID', 'Anti-inflammatory medication for arthritis');

-- Update Primary Care providers
UPDATE providers 
SET 
  condition_id = 'c1b6e124-4f52-4934-9dc1-3c4a65866b1a',
  medication_id = 'd1a5d123-4e52-4934-9dc1-3c4a65866b1a'
WHERE specialty = 'Primary Care' AND id IN (
  SELECT id FROM providers WHERE specialty = 'Primary Care' LIMIT 5
);

UPDATE providers 
SET 
  condition_id = 'c2f8e246-5f63-5a45-0ed2-4d5b76977c2b',
  medication_id = 'd2b6e234-5f63-5a45-0ed2-4d5b76977c2b'
WHERE specialty = 'Primary Care' AND condition_id IS NULL AND id IN (
  SELECT id FROM providers WHERE specialty = 'Primary Care' AND condition_id IS NULL LIMIT 5
);

-- Update Cardiology providers
UPDATE providers 
SET 
  condition_id = 'c1b6e124-4f52-4934-9dc1-3c4a65866b1a',
  medication_id = 'd1a5d123-4e52-4934-9dc1-3c4a65866b1a'
WHERE specialty = 'Cardiology' AND id IN (
  SELECT id FROM providers WHERE specialty = 'Cardiology' LIMIT 5
);

-- Update Neurology providers
UPDATE providers 
SET 
  condition_id = 'c3a9f357-6a74-6b56-1fe3-5e6c87088d3c',
  medication_id = 'd3c7f345-6a74-6b56-1fe3-5e6c87088d3c'
WHERE specialty = 'Neurology' AND id IN (
  SELECT id FROM providers WHERE specialty = 'Neurology' LIMIT 5
);

-- Update Oncology providers
UPDATE providers 
SET 
  condition_id = 'c4a0a468-7a85-7c67-2af4-6f7d98199e4d',
  medication_id = 'd4d8a456-7a85-7c67-2af4-6f7d98199e4d'
WHERE specialty = 'Oncology' AND id IN (
  SELECT id FROM providers WHERE specialty = 'Oncology' LIMIT 5
);

-- Ensure we have some overlap in conditions/medications across specialties
UPDATE providers 
SET 
  condition_id = 'c1b6e124-4f52-4934-9dc1-3c4a65866b1a',
  medication_id = 'd1a5d123-4e52-4934-9dc1-3c4a65866b1a'
WHERE condition_id IS NULL AND id IN (
  SELECT id FROM providers WHERE condition_id IS NULL LIMIT 10
);

UPDATE providers 
SET 
  condition_id = 'c2f8e246-5f63-5a45-0ed2-4d5b76977c2b',
  medication_id = 'd2b6e234-5f63-5a45-0ed2-4d5b76977c2b'
WHERE condition_id IS NULL AND id IN (
  SELECT id FROM providers WHERE condition_id IS NULL LIMIT 10
);

-- Fill in remaining providers with random conditions and medications
UPDATE providers 
SET 
  condition_id = 'c3a9f357-6a74-6b56-1fe3-5e6c87088d3c',
  medication_id = 'd3c7f345-6a74-6b56-1fe3-5e6c87088d3c'
WHERE condition_id IS NULL;