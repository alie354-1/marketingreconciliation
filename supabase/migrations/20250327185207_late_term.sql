/*
  # Add conditions and medications data

  1. New Data
    - Sample conditions for common medical conditions
    - Sample medications across different categories
    
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