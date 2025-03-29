/*
  # Add extensive data for NPI Targeter application

  1. New Data
    - Expanded geographic regions (metro areas, states, regional divisions)
    - New prescriptions table to track prescribing patterns
    - Additional medications across diverse categories
    - More medical conditions with specialties
    - Expanded provider specialties
    - Thousands of prescription records with geographic distribution

  2. Security
    - Maintain existing RLS policies
    - Add new policy for prescriptions table
*/

-- First ensure the prescriptions table doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'prescriptions') THEN
    -- Create prescriptions table to track medication prescribing patterns
    CREATE TABLE prescriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      provider_id uuid REFERENCES providers(id) NOT NULL,
      medication_id uuid REFERENCES medications(id) NOT NULL,
      condition_id uuid REFERENCES conditions(id) NOT NULL,
      prescription_location uuid REFERENCES geographic_regions(id) NOT NULL,
      fill_location uuid REFERENCES geographic_regions(id),
      prescription_date date NOT NULL,
      quantity integer NOT NULL,
      days_supply integer NOT NULL,
      refills integer NOT NULL DEFAULT 0,
      notes text,
      created_at timestamptz DEFAULT now()
    );

    -- Create indexes for better query performance
    CREATE INDEX idx_prescriptions_provider ON prescriptions(provider_id);
    CREATE INDEX idx_prescriptions_medication ON prescriptions(medication_id);
    CREATE INDEX idx_prescriptions_condition ON prescriptions(condition_id);
    CREATE INDEX idx_prescriptions_location ON prescriptions(prescription_location);
    CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date);

    -- Enable RLS on the prescriptions table
    ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

    -- Create policy for prescriptions
    CREATE POLICY "Allow authenticated read access for prescriptions"
      ON prescriptions FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- Clear existing regions to rebuild with more extensive data
TRUNCATE TABLE geographic_regions CASCADE;

-- Insert US region divisions
INSERT INTO geographic_regions (id, name, type, population) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Northeast', 'Region', 57609148),
  ('10000000-0000-0000-0000-000000000002', 'Southeast', 'Region', 97239491),
  ('10000000-0000-0000-0000-000000000003', 'Midwest', 'Region', 68841444),
  ('10000000-0000-0000-0000-000000000004', 'Southwest', 'Region', 42716786),
  ('10000000-0000-0000-0000-000000000005', 'West', 'Region', 78347268);

-- Insert US states with correct region associations
INSERT INTO geographic_regions (id, name, type, population) VALUES
  -- Northeast states
  ('20000000-0000-0000-0000-000000000001', 'Maine', 'State', 1362359),
  ('20000000-0000-0000-0000-000000000002', 'New Hampshire', 'State', 1377529),
  ('20000000-0000-0000-0000-000000000003', 'Vermont', 'State', 643077),
  ('20000000-0000-0000-0000-000000000004', 'Massachusetts', 'State', 6984723),
  ('20000000-0000-0000-0000-000000000005', 'Rhode Island', 'State', 1095610),
  ('20000000-0000-0000-0000-000000000006', 'Connecticut', 'State', 3605944),
  ('20000000-0000-0000-0000-000000000007', 'New York', 'State', 20201249),
  ('20000000-0000-0000-0000-000000000008', 'New Jersey', 'State', 9288994),
  ('20000000-0000-0000-0000-000000000009', 'Pennsylvania', 'State', 13002700),
  
  -- Southeast states
  ('20000000-0000-0000-0000-000000000010', 'Delaware', 'State', 1003384),
  ('20000000-0000-0000-0000-000000000011', 'Maryland', 'State', 6177224),
  ('20000000-0000-0000-0000-000000000012', 'Virginia', 'State', 8631393),
  ('20000000-0000-0000-0000-000000000013', 'West Virginia', 'State', 1793716),
  ('20000000-0000-0000-0000-000000000014', 'North Carolina', 'State', 10439388),
  ('20000000-0000-0000-0000-000000000015', 'South Carolina', 'State', 5118425),
  ('20000000-0000-0000-0000-000000000016', 'Georgia', 'State', 10711908),
  ('20000000-0000-0000-0000-000000000017', 'Florida', 'State', 21538187),
  ('20000000-0000-0000-0000-000000000018', 'Kentucky', 'State', 4505836),
  ('20000000-0000-0000-0000-000000000019', 'Tennessee', 'State', 6910840),
  ('20000000-0000-0000-0000-000000000020', 'Alabama', 'State', 4903185),
  ('20000000-0000-0000-0000-000000000021', 'Mississippi', 'State', 2961279),
  ('20000000-0000-0000-0000-000000000022', 'Arkansas', 'State', 3011524),
  ('20000000-0000-0000-0000-000000000023', 'Louisiana', 'State', 4657757),
  
  -- Midwest states
  ('20000000-0000-0000-0000-000000000024', 'Ohio', 'State', 11799448),
  ('20000000-0000-0000-0000-000000000025', 'Indiana', 'State', 6785528),
  ('20000000-0000-0000-0000-000000000026', 'Michigan', 'State', 10077331),
  ('20000000-0000-0000-0000-000000000027', 'Illinois', 'State', 12812508),
  ('20000000-0000-0000-0000-000000000028', 'Wisconsin', 'State', 5893718),
  ('20000000-0000-0000-0000-000000000029', 'Minnesota', 'State', 5639632),
  ('20000000-0000-0000-0000-000000000030', 'Iowa', 'State', 3155070),
  ('20000000-0000-0000-0000-000000000031', 'Missouri', 'State', 6154913),
  ('20000000-0000-0000-0000-000000000032', 'North Dakota', 'State', 762062),
  ('20000000-0000-0000-0000-000000000033', 'South Dakota', 'State', 884659),
  ('20000000-0000-0000-0000-000000000034', 'Nebraska', 'State', 1934408),
  ('20000000-0000-0000-0000-000000000035', 'Kansas', 'State', 2937880),
  
  -- Southwest states
  ('20000000-0000-0000-0000-000000000036', 'Oklahoma', 'State', 3956971),
  ('20000000-0000-0000-0000-000000000037', 'Texas', 'State', 29145505),
  ('20000000-0000-0000-0000-000000000038', 'New Mexico', 'State', 2117522),
  ('20000000-0000-0000-0000-000000000039', 'Arizona', 'State', 7151502),
  
  -- West states
  ('20000000-0000-0000-0000-000000000040', 'Montana', 'State', 1068778),
  ('20000000-0000-0000-0000-000000000041', 'Idaho', 'State', 1839106),
  ('20000000-0000-0000-0000-000000000042', 'Wyoming', 'State', 576851),
  ('20000000-0000-0000-0000-000000000043', 'Colorado', 'State', 5773714),
  ('20000000-0000-0000-0000-000000000044', 'Utah', 'State', 3205958),
  ('20000000-0000-0000-0000-000000000045', 'Nevada', 'State', 3104614),
  ('20000000-0000-0000-0000-000000000046', 'California', 'State', 39538223),
  ('20000000-0000-0000-0000-000000000047', 'Oregon', 'State', 4217737),
  ('20000000-0000-0000-0000-000000000048', 'Washington', 'State', 7705281),
  ('20000000-0000-0000-0000-000000000049', 'Alaska', 'State', 733391),
  ('20000000-0000-0000-0000-000000000050', 'Hawaii', 'State', 1455271);

-- Insert top metropolitan areas
INSERT INTO geographic_regions (id, name, type, population) VALUES
  -- Top 20 metropolitan areas
  ('30000000-0000-0000-0000-000000000001', 'New York-Newark-Jersey City', 'Metro', 19216182),
  ('30000000-0000-0000-0000-000000000002', 'Los Angeles-Long Beach-Anaheim', 'Metro', 13200998),
  ('30000000-0000-0000-0000-000000000003', 'Chicago-Naperville-Elgin', 'Metro', 9458539),
  ('30000000-0000-0000-0000-000000000004', 'Dallas-Fort Worth-Arlington', 'Metro', 7637387),
  ('30000000-0000-0000-0000-000000000005', 'Houston-The Woodlands-Sugar Land', 'Metro', 7122240),
  ('30000000-0000-0000-0000-000000000006', 'Washington-Arlington-Alexandria', 'Metro', 6417438),
  ('30000000-0000-0000-0000-000000000007', 'Philadelphia-Camden-Wilmington', 'Metro', 6102434),
  ('30000000-0000-0000-0000-000000000008', 'Miami-Fort Lauderdale-Pompano Beach', 'Metro', 6091747),
  ('30000000-0000-0000-0000-000000000009', 'Atlanta-Sandy Springs-Alpharetta', 'Metro', 6020364),
  ('30000000-0000-0000-0000-000000000010', 'Boston-Cambridge-Newton', 'Metro', 4873019),
  ('30000000-0000-0000-0000-000000000011', 'Phoenix-Mesa-Chandler', 'Metro', 4845832),
  ('30000000-0000-0000-0000-000000000012', 'San Francisco-Oakland-Berkeley', 'Metro', 4701332),
  ('30000000-0000-0000-0000-000000000013', 'Riverside-San Bernardino-Ontario', 'Metro', 4600396),
  ('30000000-0000-0000-0000-000000000014', 'Detroit-Warren-Dearborn', 'Metro', 4319629),
  ('30000000-0000-0000-0000-000000000015', 'Seattle-Tacoma-Bellevue', 'Metro', 3979845),
  ('30000000-0000-0000-0000-000000000016', 'Minneapolis-St. Paul-Bloomington', 'Metro', 3640043),
  ('30000000-0000-0000-0000-000000000017', 'San Diego-Chula Vista-Carlsbad', 'Metro', 3298634),
  ('30000000-0000-0000-0000-000000000018', 'Tampa-St. Petersburg-Clearwater', 'Metro', 3175275),
  ('30000000-0000-0000-0000-000000000019', 'Denver-Aurora-Lakewood', 'Metro', 2932415),
  ('30000000-0000-0000-0000-000000000020', 'Baltimore-Columbia-Towson', 'Metro', 2800053);

-- Expand provider specialties
TRUNCATE TABLE specialties CASCADE;
INSERT INTO specialties (id, name, description) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Primary Care', 'General practice and family medicine'),
  ('40000000-0000-0000-0000-000000000002', 'Cardiology', 'Heart and cardiovascular system specialists'),
  ('40000000-0000-0000-0000-000000000003', 'Endocrinology', 'Hormone and metabolic disorder specialists'),
  ('40000000-0000-0000-0000-000000000004', 'Psychiatry', 'Mental health specialists'),
  ('40000000-0000-0000-0000-000000000005', 'Pulmonology', 'Respiratory system specialists'),
  ('40000000-0000-0000-0000-000000000006', 'Rheumatology', 'Joint and autoimmune disorder specialists'),
  ('40000000-0000-0000-0000-000000000007', 'Neurology', 'Nervous system specialists'),
  ('40000000-0000-0000-0000-000000000008', 'Oncology', 'Cancer specialists'),
  ('40000000-0000-0000-0000-000000000009', 'Gastroenterology', 'Digestive system specialists'),
  ('40000000-0000-0000-0000-000000000010', 'Dermatology', 'Skin specialists'),
  ('40000000-0000-0000-0000-000000000011', 'Nephrology', 'Kidney specialists'),
  ('40000000-0000-0000-0000-000000000012', 'Urology', 'Urinary tract specialists'),
  ('40000000-0000-0000-0000-000000000013', 'Obstetrics & Gynecology', 'Women\'s health specialists'),
  ('40000000-0000-0000-0000-000000000014', 'Ophthalmology', 'Eye specialists'),
  ('40000000-0000-0000-0000-000000000015', 'Orthopedics', 'Musculoskeletal specialists'),
  ('40000000-0000-0000-0000-000000000016', 'Pediatrics', 'Child health specialists'),
  ('40000000-0000-0000-0000-000000000017', 'Geriatrics', 'Elderly care specialists'),
  ('40000000-0000-0000-0000-000000000018', 'Hematology', 'Blood disorder specialists'),
  ('40000000-0000-0000-0000-000000000019', 'Infectious Disease', 'Infection specialists'),
  ('40000000-0000-0000-0000-000000000020', 'Pain Management', 'Pain control specialists'),
  ('40000000-0000-0000-0000-000000000021', 'Allergy & Immunology', 'Allergy and immune system specialists'),
  ('40000000-0000-0000-0000-000000000022', 'Physical Medicine & Rehabilitation', 'Rehabilitation specialists'),
  ('40000000-0000-0000-0000-000000000023', 'Emergency Medicine', 'Emergency care specialists'),
  ('40000000-0000-0000-0000-000000000024', 'Internal Medicine', 'Adult medicine specialists');

-- Add more medical conditions
TRUNCATE TABLE conditions CASCADE;
INSERT INTO conditions (id, name, description) VALUES
  -- Cardiovascular conditions
  ('50000000-0000-0000-0000-000000000001', 'Hypertension', 'High blood pressure requiring management'),
  ('50000000-0000-0000-0000-000000000002', 'Coronary Artery Disease', 'Narrowing of coronary arteries'),
  ('50000000-0000-0000-0000-000000000003', 'Atrial Fibrillation', 'Irregular heart rhythm condition'),
  ('50000000-0000-0000-0000-000000000004', 'Heart Failure', 'Heart unable to pump sufficiently'),
  ('50000000-0000-0000-0000-000000000005', 'Hyperlipidemia', 'High cholesterol levels'),
  
  -- Endocrine conditions
  ('50000000-0000-0000-0000-000000000006', 'Type 2 Diabetes', 'Metabolic disorder affecting blood sugar levels'),
  ('50000000-0000-0000-0000-000000000007', 'Type 1 Diabetes', 'Autoimmune disorder affecting insulin production'),
  ('50000000-0000-0000-0000-000000000008', 'Hypothyroidism', 'Underactive thyroid gland'),
  ('50000000-0000-0000-0000-000000000009', 'Hyperthyroidism', 'Overactive thyroid gland'),
  ('50000000-0000-0000-0000-000000000010', 'Obesity', 'Excess body fat accumulation with health impacts'),
  
  -- Mental health conditions
  ('50000000-0000-0000-0000-000000000011', 'Major Depressive Disorder', 'Clinical depression'),
  ('50000000-0000-0000-0000-000000000012', 'Generalized Anxiety Disorder', 'Persistent and excessive worry'),
  ('50000000-0000-0000-0000-000000000013', 'Bipolar Disorder', 'Mood disorder with manic and depressive episodes'),
  ('50000000-0000-0000-0000-000000000014', 'Schizophrenia', 'Serious mental disorder affecting thinking and behavior'),
  ('50000000-0000-0000-0000-000000000015', 'ADHD', 'Attention deficit hyperactivity disorder'),
  
  -- Respiratory conditions
  ('50000000-0000-0000-0000-000000000016', 'Asthma', 'Chronic respiratory condition with periodic breathing difficulties'),
  ('50000000-0000-0000-0000-000000000017', 'COPD', 'Chronic obstructive pulmonary disease'),
  ('50000000-0000-0000-0000-000000000018', 'Sleep Apnea', 'Sleep disorder with breathing interruptions'),
  ('50000000-0000-0000-0000-000000000019', 'Pulmonary Fibrosis', 'Scarring of lung tissue'),
  ('50000000-0000-0000-0000-000000000020', 'Allergic Rhinitis', 'Hay fever or seasonal allergies'),
  
  -- Musculoskeletal conditions
  ('50000000-0000-0000-0000-000000000021', 'Osteoarthritis', 'Degenerative joint disease'),
  ('50000000-0000-0000-0000-000000000022', 'Rheumatoid Arthritis', 'Autoimmune inflammatory joint condition'),
  ('50000000-0000-0000-0000-000000000023', 'Osteoporosis', 'Bone density loss leading to fragility'),
  ('50000000-0000-0000-0000-000000000024', 'Fibromyalgia', 'Chronic widespread pain and tenderness'),
  ('50000000-0000-0000-0000-000000000025', 'Lower Back Pain', 'Chronic pain in lumbar region'),
  
  -- Neurological conditions
  ('50000000-0000-0000-0000-000000000026', 'Migraine', 'Recurring severe headaches'),
  ('50000000-0000-0000-0000-000000000027', 'Epilepsy', 'Neurological disorder with seizures'),
  ('50000000-0000-0000-0000-000000000028', 'Multiple Sclerosis', 'Autoimmune disease affecting central nervous system'),
  ('50000000-0000-0000-0000-000000000029', 'Parkinson\'s Disease', 'Progressive nervous system disorder'),
  ('50000000-0000-0000-0000-000000000030', 'Alzheimer\'s Disease', 'Progressive dementia affecting memory and cognition'),
  
  -- Gastrointestinal conditions
  ('50000000-0000-0000-0000-000000000031', 'GERD', 'Gastroesophageal reflux disease'),
  ('50000000-0000-0000-0000-000000000032', 'Irritable Bowel Syndrome', 'Functional gastrointestinal disorder'),
  ('50000000-0000-0000-0000-000000000033', 'Crohn\'s Disease', 'Inflammatory bowel disease'),
  ('50000000-0000-0000-0000-000000000034', 'Ulcerative Colitis', 'Inflammatory bowel disease affecting colon'),
  ('50000000-0000-0000-0000-000000000035', 'Celiac Disease', 'Immune reaction to gluten');

-- Add more medications
TRUNCATE TABLE medications CASCADE;
INSERT INTO medications (id, name, category, description) VALUES
  -- Cardiovascular medications
  ('60000000-0000-0000-0000-000000000001', 'Lisinopril', 'ACE Inhibitor', 'Treatment for hypertension and heart failure'),
  ('60000000-0000-0000-0000-000000000002', 'Metoprolol', 'Beta Blocker', 'Treatment for hypertension, angina, and heart failure'),
  ('60000000-0000-0000-0000-000000000003', 'Amlodipine', 'Calcium Channel Blocker', 'Treatment for hypertension and coronary artery disease'),
  ('60000000-0000-0000-0000-000000000004', 'Losartan', 'ARB', 'Treatment for hypertension and kidney protection in diabetes'),
  ('60000000-0000-0000-0000-000000000005', 'Atorvastatin', 'Statin', 'Lowers cholesterol and prevents cardiovascular events'),
  ('60000000-0000-0000-0000-000000000006', 'Simvastatin', 'Statin', 'Lowers cholesterol and prevents cardiovascular events'),
  ('60000000-0000-0000-0000-000000000007', 'Warfarin', 'Anticoagulant', 'Prevents blood clots and strokes'),
  ('60000000-0000-0000-0000-000000000008', 'Apixaban', 'Anticoagulant', 'Prevents blood clots and strokes'),
  ('60000000-0000-0000-0000-000000000009', 'Furosemide', 'Loop Diuretic', 'Treats high blood pressure and fluid retention'),
  ('60000000-0000-0000-0000-000000000010', 'Spironolactone', 'Potassium-sparing Diuretic', 'Treats heart failure and high blood pressure'),
  
  -- Endocrine medications
  ('60000000-0000-0000-0000-000000000011', 'Metformin', 'Biguanide', 'First-line medication for type 2 diabetes'),
  ('60000000-0000-0000-0000-000000000012', 'Glipizide', 'Sulfonylurea', 'Stimulates insulin production for type 2 diabetes'),
  ('60000000-0000-0000-0000-000000000013', 'Insulin Glargine', 'Long-acting Insulin', 'Long-acting insulin for diabetes management'),
  ('60000000-0000-0000-0000-000000000014', 'Insulin Lispro', 'Rapid-acting Insulin', 'Rapid-acting insulin for diabetes management'),
  ('60000000-0000-0000-0000-000000000015', 'Levothyroxine', 'Thyroid Hormone', 'Treats hypothyroidism'),
  ('60000000-0000-0000-0000-000000000016', 'Methimazole', 'Antithyroid', 'Treats hyperthyroidism'),
  ('60000000-0000-0000-0000-000000000017', 'Sitagliptin', 'DPP-4 Inhibitor', 'Treats type 2 diabetes'),
  ('60000000-0000-0000-0000-000000000018', 'Empagliflozin', 'SGLT2 Inhibitor', 'Treats type 2 diabetes with cardiovascular benefits'),
  ('60000000-0000-0000-0000-000000000019', 'Semaglutide', 'GLP-1 Receptor Agonist', 'Treats type 2 diabetes and supports weight loss'),
  ('60000000-0000-0000-0000-000000000020', 'Liraglutide', 'GLP-1 Receptor Agonist', 'Treats type 2 diabetes and supports weight loss'),
  
  -- Mental health medications
  ('60000000-0000-0000-0000-000000000021', 'Sertraline', 'SSRI', 'Antidepressant medication'),
  ('60000000-0000-0000-0000-000000000022', 'Escitalopram', 'SSRI', 'Treatment for anxiety and depression'),
  ('60000000-0000-0000-0000-000000000023', 'Fluoxetine', 'SSRI', 'Treatment for depression, OCD, and bulimia'),
  ('60000000-0000-0000-0000-000000000024', 'Bupropion', 'NDRI', 'Antidepressant and smoking cessation aid'),
  ('60000000-0000-0000-0000-000000000025', 'Venlafaxine', 'SNRI', 'Treatment for depression and anxiety disorders'),
  ('60000000-0000-0000-0000-000000000026', 'Duloxetine', 'SNRI', 'Treatment for depression, anxiety, and certain pain conditions'),
  ('60000000-0000-0000-0000-000000000027', 'Aripiprazole', 'Atypical Antipsychotic', 'Treatment for schizophrenia and bipolar disorder'),
  ('60000000-0000-0000-0000-000000000028', 'Quetiapine', 'Atypical Antipsychotic', 'Treatment for schizophrenia and bipolar disorder'),
  ('60000000-0000-0000-0000-000000000029', 'Lamotrigine', 'Anticonvulsant Mood Stabilizer', 'Treatment for bipolar disorder and epilepsy'),
  ('60000000-0000-0000-0000-000000000030', 'Methylphenidate', 'CNS Stimulant', 'Treatment for ADHD'),
  
  -- Respiratory medications
  ('60000000-0000-0000-0000-000000000031', 'Albuterol', 'Short-acting Beta Agonist', 'Relief medication for asthma'),
  ('60000000-0000-0000-0000-000000000032', 'Fluticasone', 'Inhaled Corticosteroid', 'Anti-inflammatory for respiratory conditions'),
  ('60000000-0000-0000-0000-000000000033', 'Tiotropium', 'Long-acting Anticholinergic', 'Maintenance therapy for COPD'),
  ('60000000-0000-0000-0000-000000000034', 'Montelukast', 'Leukotriene Receptor Antagonist', 'Preventive treatment for asthma'),
  ('60000000-0000-0000-0000-000000000035', 'Salmeterol/Fluticasone', 'LABA/ICS Combination', 'Maintenance therapy for asthma and COPD'),
  
  -- Musculoskeletal medications
  ('60000000-0000-0000-0000-000000000036', 'Ibuprofen', 'NSAID', 'Anti-inflammatory for pain and inflammation'),
  ('60000000-0000-0000-0000-000000000037', 'Naproxen', 'NSAID', 'Anti-inflammatory for pain and inflammation'),
  ('60000000-0000-0000-0000-000000000038', 'Celecoxib', 'COX-2 Inhibitor', 'Anti-inflammatory with reduced GI side effects'),
  ('60000000-0000-0000-0000-000000000039', 'Prednisone', 'Corticosteroid', 'Potent anti-inflammatory for various conditions'),
  ('60000000-0000-0000-0000-000000000040', 'Adalimumab', 'Biologic (TNF Inhibitor)', 'Treatment for rheumatoid arthritis and other autoimmune conditions'),
  ('60000000-0000-0000-0000-000000000041', 'Methotrexate', 'DMARD', 'Disease-modifying treatment for autoimmune conditions'),
  ('60000000-0000-0000-0000-000000000042', 'Alendronate', 'Bisphosphonate', 'Treatment for osteoporosis'),
  
  -- Neurological medications
  ('60000000-0000-0000-0000-000000000043', 'Sumatriptan', 'Triptan', 'Acute treatment for migraines'),
  ('60000000-0000-0000-0000-000000000044', 'Gabapentin', 'Anticonvulsant', 'Treatment for neuropathic pain and seizures'),
  ('60000000-0000-0000-0000-000000000045', 'Pregabalin', 'Anticonvulsant', 'Treatment for neuropathic pain, seizures, and anxiety'),
  ('60000000-0000-0000-0000-000000000046
