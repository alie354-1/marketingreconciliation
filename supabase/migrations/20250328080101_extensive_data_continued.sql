/*
  # Continue adding extensive data for NPI Targeter application
  
  This file continues from 20250328080100_extensive_data.sql which was truncated
  
  1. Additional Data
    - Complete the medications list
    - Add provider data with geographic distribution
    - Generate thousands of prescription records
    - Set up realistic geographic prescribing patterns
*/

-- Continue medications list (neurological medications continued and others)
INSERT INTO medications (id, name, category, description) VALUES
  ('60000000-0000-0000-0000-000000000046', 'Levetiracetam', 'Anticonvulsant', 'Treatment for epilepsy and seizures'),
  ('60000000-0000-0000-0000-000000000047', 'Topiramate', 'Anticonvulsant', 'Treatment for epilepsy, migraines, and other conditions'),
  ('60000000-0000-0000-0000-000000000048', 'Donepezil', 'Cholinesterase Inhibitor', 'Treatment for Alzheimer\'s disease'),
  ('60000000-0000-0000-0000-000000000049', 'Memantine', 'NMDA Receptor Antagonist', 'Treatment for moderate to severe Alzheimer\'s disease'),
  ('60000000-0000-0000-0000-000000000050', 'Carbidopa/Levodopa', 'Dopamine Precursor', 'Treatment for Parkinson\'s disease'),
  
  -- Gastrointestinal medications
  ('60000000-0000-0000-0000-000000000051', 'Omeprazole', 'Proton Pump Inhibitor', 'Treatment for GERD and peptic ulcers'),
  ('60000000-0000-0000-0000-000000000052', 'Pantoprazole', 'Proton Pump Inhibitor', 'Treatment for GERD and esophagitis'),
  ('60000000-0000-0000-0000-000000000053', 'Famotidine', 'H2 Blocker', 'Treatment for heartburn and peptic ulcers'),
  ('60000000-0000-0000-0000-000000000054', 'Mesalamine', 'Anti-inflammatory', 'Treatment for ulcerative colitis'),
  ('60000000-0000-0000-0000-000000000055', 'Adalimumab', 'Biologic', 'Treatment for Crohn\'s disease and ulcerative colitis');

-- Create sample providers with different specialties and geographic distribution
-- We'll create 200 providers distributed across specialties and regions

-- Primary Care providers (largest group)
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Primary Care',
  (
    CASE 
      WHEN random() < 0.6 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.3 THEN 'Small (1-5 providers)'
      WHEN random() < 0.7 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 40);

-- Cardiology providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Cardiology',
  (
    CASE 
      WHEN random() < 0.7 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.3 THEN 'Small (1-5 providers)'
      WHEN random() < 0.7 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 20);

-- Endocrinology providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Endocrinology',
  (
    CASE 
      WHEN random() < 0.7 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.4 THEN 'Small (1-5 providers)'
      WHEN random() < 0.8 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 15);

-- Psychiatry providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Psychiatry',
  (
    CASE 
      WHEN random() < 0.65 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.6 THEN 'Small (1-5 providers)'
      WHEN random() < 0.9 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 15);

-- Neurology providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Neurology',
  (
    CASE 
      WHEN random() < 0.7 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.4 THEN 'Small (1-5 providers)'
      WHEN random() < 0.8 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 15);

-- Pulmonology providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Pulmonology',
  (
    CASE 
      WHEN random() < 0.7 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.4 THEN 'Small (1-5 providers)'
      WHEN random() < 0.8 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 15);

-- Rheumatology providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Rheumatology',
  (
    CASE 
      WHEN random() < 0.6 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.5 THEN 'Small (1-5 providers)'
      WHEN random() < 0.9 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 15);

-- Gastroenterology providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  'Gastroenterology',
  (
    CASE 
      WHEN random() < 0.7 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.4 THEN 'Small (1-5 providers)'
      WHEN random() < 0.8 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 15);

-- Other specialty providers
INSERT INTO providers (id, specialty, geographic_area, practice_size)
SELECT 
  gen_random_uuid(),
  (SELECT name FROM specialties WHERE id NOT IN ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000009') ORDER BY random() LIMIT 1),
  (
    CASE 
      WHEN random() < 0.6 THEN (SELECT name FROM geographic_regions WHERE type = 'Metro' ORDER BY random() LIMIT 1)
      ELSE (SELECT name FROM geographic_regions WHERE type = 'State' ORDER BY random() LIMIT 1)
    END
  ),
  (
    CASE 
      WHEN random() < 0.4 THEN 'Small (1-5 providers)'
      WHEN random() < 0.8 THEN 'Medium (6-20 providers)'
      ELSE 'Large (21+ providers)'
    END
  )
FROM generate_series(1, 50);

-- Generate prescription data with realistic patterns using PL/pgSQL
-- This approach avoids the problematic CROSS JOIN syntax

-- First block: Process Primary Care, Cardiology, Endocrinology, and Psychiatry providers
DO $$
DECLARE
  provider_record RECORD;
  medication_id uuid;
  condition_id uuid;
  counter INTEGER;
BEGIN
  -- Process Primary Care providers (15 prescriptions per provider)
  FOR provider_record IN SELECT id FROM providers WHERE specialty = 'Primary Care' LOOP
    FOR counter IN 1..15 LOOP
      -- Select medication with appropriate weighting
      IF random() < 0.3 THEN
        medication_id := '60000000-0000-0000-0000-000000000001'; -- Lisinopril (hypertension)
      ELSIF random() < 0.5 THEN
        medication_id := '60000000-0000-0000-0000-000000000011'; -- Metformin (diabetes)
      ELSIF random() < 0.7 THEN
        medication_id := '60000000-0000-0000-0000-000000000005'; -- Atorvastatin (cholesterol)
      ELSIF random() < 0.8 THEN
        medication_id := '60000000-0000-0000-0000-000000000021'; -- Sertraline (depression)
      ELSE
        SELECT id INTO medication_id FROM medications ORDER BY random() LIMIT 1;
      END IF;
      
      -- Match condition to medication
      IF random() < 0.7 THEN
        CASE medication_id
          WHEN '60000000-0000-0000-0000-000000000001' THEN condition_id := '50000000-0000-0000-0000-000000000001'; -- Hypertension
          WHEN '60000000-0000-0000-0000-000000000011' THEN condition_id := '50000000-0000-0000-0000-000000000006'; -- Type 2 Diabetes
          WHEN '60000000-0000-0000-0000-000000000005' THEN condition_id := '50000000-0000-0000-0000-000000000005'; -- Hyperlipidemia
          WHEN '60000000-0000-0000-0000-000000000021' THEN condition_id := '50000000-0000-0000-0000-000000000011'; -- Depression
          ELSE SELECT id INTO condition_id FROM conditions ORDER BY random() LIMIT 1;
        END CASE;
      ELSE
        SELECT id INTO condition_id FROM conditions ORDER BY random() LIMIT 1;
      END IF;
      
      -- Insert the prescription
      INSERT INTO prescriptions (
        provider_id, medication_id, condition_id, prescription_location, fill_location, 
        prescription_date, quantity, days_supply, refills
      ) VALUES (
        provider_record.id,
        medication_id,
        condition_id,
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (current_date - (random() * 365)::integer * interval '1 day'),
        (30 + (random() * 60)::integer),
        (30 + (random() * 60)::integer),
        (random() * 3)::integer
      );
    END LOOP;
  END LOOP;
  
  -- Process Cardiology providers (10 prescriptions per provider)
  FOR provider_record IN SELECT id FROM providers WHERE specialty = 'Cardiology' LOOP
    FOR counter IN 1..10 LOOP
      -- Select medication with appropriate weighting for cardiology
      IF random() < 0.25 THEN
        medication_id := '60000000-0000-0000-0000-000000000001'; -- Lisinopril
      ELSIF random() < 0.45 THEN
        medication_id := '60000000-0000-0000-0000-000000000002'; -- Metoprolol
      ELSIF random() < 0.65 THEN
        medication_id := '60000000-0000-0000-0000-000000000005'; -- Atorvastatin
      ELSIF random() < 0.85 THEN
        medication_id := '60000000-0000-0000-0000-000000000004'; -- Losartan
      ELSE
        medication_id := '60000000-0000-0000-0000-000000000007'; -- Warfarin
      END IF;
      
      -- Match condition to cardiology medication
      IF random() < 0.8 THEN
        IF random() < 0.4 THEN 
          condition_id := '50000000-0000-0000-0000-000000000001'; -- Hypertension
        ELSIF random() < 0.6 THEN 
          condition_id := '50000000-0000-0000-0000-000000000002'; -- Coronary Artery Disease
        ELSIF random() < 0.8 THEN 
          condition_id := '50000000-0000-0000-0000-000000000003'; -- Atrial Fibrillation
        ELSE 
          condition_id := '50000000-0000-0000-0000-000000000004'; -- Heart Failure
        END IF;
      ELSE
        condition_id := '50000000-0000-0000-0000-000000000005'; -- Hyperlipidemia
      END IF;
      
      -- Insert the prescription
      INSERT INTO prescriptions (
        provider_id, medication_id, condition_id, prescription_location, fill_location, 
        prescription_date, quantity, days_supply, refills
      ) VALUES (
        provider_record.id,
        medication_id,
        condition_id,
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (current_date - (random() * 365)::integer * interval '1 day'),
        (30 + (random() * 60)::integer),
        (30 + (random() * 60)::integer),
        (random() * 3)::integer
      );
    END LOOP;
  END LOOP;
  
  -- Process Endocrinology providers (10 prescriptions per provider)
  FOR provider_record IN SELECT id FROM providers WHERE specialty = 'Endocrinology' LOOP
    FOR counter IN 1..10 LOOP
      -- Select medication with appropriate weighting for endocrinology
      IF random() < 0.3 THEN
        medication_id := '60000000-0000-0000-0000-000000000011'; -- Metformin
      ELSIF random() < 0.5 THEN
        medication_id := '60000000-0000-0000-0000-000000000015'; -- Levothyroxine
      ELSIF random() < 0.7 THEN
        medication_id := '60000000-0000-0000-0000-000000000019'; -- Semaglutide
      ELSE
        medication_id := '60000000-0000-0000-0000-000000000013'; -- Insulin Glargine
      END IF;
      
      -- Match condition to endocrinology medication
      IF random() < 0.8 THEN
        IF random() < 0.5 THEN 
          condition_id := '50000000-0000-0000-0000-000000000006'; -- Type 2 Diabetes
        ELSIF random() < 0.7 THEN 
          condition_id := '50000000-0000-0000-0000-000000000008'; -- Hypothyroidism
        ELSIF random() < 0.9 THEN 
          condition_id := '50000000-0000-0000-0000-000000000010'; -- Obesity
        ELSE 
          condition_id := '50000000-0000-0000-0000-000000000007'; -- Type 1 Diabetes
        END IF;
      ELSE
        condition_id := '50000000-0000-0000-0000-000000000009'; -- Hyperthyroidism
      END IF;
      
      -- Insert the prescription
      INSERT INTO prescriptions (
        provider_id, medication_id, condition_id, prescription_location, fill_location, 
        prescription_date, quantity, days_supply, refills
      ) VALUES (
        provider_record.id,
        medication_id,
        condition_id,
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (current_date - (random() * 365)::integer * interval '1 day'),
        (30 + (random() * 60)::integer),
        (30 + (random() * 60)::integer),
        (random() * 3)::integer
      );
    END LOOP;
  END LOOP;
  
  -- Process Psychiatry providers (15 prescriptions per provider)
  FOR provider_record IN SELECT id FROM providers WHERE specialty = 'Psychiatry' LOOP
    FOR counter IN 1..15 LOOP
      -- Select medication with appropriate weighting for psychiatry
      IF random() < 0.25 THEN
        medication_id := '60000000-0000-0000-0000-000000000021'; -- Sertraline
      ELSIF random() < 0.45 THEN
        medication_id := '60000000-0000-0000-0000-000000000022'; -- Escitalopram
      ELSIF random() < 0.65 THEN
        medication_id := '60000000-0000-0000-0000-000000000025'; -- Venlafaxine
      ELSIF random() < 0.85 THEN
        medication_id := '60000000-0000-0000-0000-000000000027'; -- Aripiprazole
      ELSE
        medication_id := '60000000-0000-0000-0000-000000000030'; -- Methylphenidate
      END IF;
      
      -- Match condition to psychiatry medication
      IF random() < 0.8 THEN
        IF random() < 0.4 THEN 
          condition_id := '50000000-0000-0000-0000-000000000011'; -- Major Depressive Disorder
        ELSIF random() < 0.6 THEN 
          condition_id := '50000000-0000-0000-0000-000000000012'; -- Generalized Anxiety Disorder
        ELSIF random() < 0.8 THEN 
          condition_id := '50000000-0000-0000-0000-000000000013'; -- Bipolar Disorder
        ELSE 
          condition_id := '50000000-0000-0000-0000-000000000015'; -- ADHD
        END IF;
      ELSE
        condition_id := '50000000-0000-0000-0000-000000000014'; -- Schizophrenia
      END IF;
      
      -- Insert the prescription
      INSERT INTO prescriptions (
        provider_id, medication_id, condition_id, prescription_location, fill_location, 
        prescription_date, quantity, days_supply, refills
      ) VALUES (
        provider_record.id,
        medication_id,
        condition_id,
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (current_date - (random() * 365)::integer * interval '1 day'),
        (30 + (random() * 30)::integer),
        (30 + (random() * 30)::integer),
        (random() * 5)::integer
      );
    END LOOP;
  END LOOP;
END $$;

-- Second block: Process Pulmonology and other providers
DO $$
DECLARE
  provider_record RECORD;
  medication_id uuid;
  condition_id uuid;
  counter INTEGER;
BEGIN
  -- Process Pulmonology providers (10 prescriptions per provider)
  FOR provider_record IN SELECT id FROM providers WHERE specialty = 'Pulmonology' LOOP
    FOR counter IN 1..10 LOOP
      -- Select medication with appropriate weighting for pulmonology
      IF random() < 0.3 THEN
        medication_id := '60000000-0000-0000-0000-000000000031'; -- Albuterol
      ELSIF random() < 0.6 THEN
        medication_id := '60000000-0000-0000-0000-000000000032'; -- Fluticasone
      ELSIF random() < 0.8 THEN
        medication_id := '60000000-0000-0000-0000-000000000033'; -- Tiotropium
      ELSE
        medication_id := '60000000-0000-0000-0000-000000000035'; -- Salmeterol/Fluticasone
      END IF;
      
      -- Match condition to pulmonology medication
      IF random() < 0.8 THEN
        IF random() < 0.5 THEN 
          condition_id := '50000000-0000-0000-0000-000000000016'; -- Asthma
        ELSIF random() < 0.8 THEN 
          condition_id := '50000000-0000-0000-0000-000000000017'; -- COPD
        ELSE 
          condition_id := '50000000-0000-0000-0000-000000000018'; -- Sleep Apnea
        END IF;
      ELSE
        condition_id := '50000000-0000-0000-0000-000000000020'; -- Allergic Rhinitis
      END IF;
      
      -- Insert the prescription
      INSERT INTO prescriptions (
        provider_id, medication_id, condition_id, prescription_location, fill_location, 
        prescription_date, quantity, days_supply, refills
      ) VALUES (
        provider_record.id,
        medication_id,
        condition_id,
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (current_date - (random() * 365)::integer * interval '1 day'),
        (1 + (random() * 3)::integer),
        (30 + (random() * 60)::integer),
        (random() * 11)::integer
      );
    END LOOP;
  END LOOP;
  
  -- Process other providers (5 prescriptions per provider)
  FOR provider_record IN SELECT id FROM providers WHERE specialty NOT IN ('Primary Care', 'Cardiology', 'Endocrinology', 'Psychiatry', 'Pulmonology') LOOP
    FOR counter IN 1..5 LOOP
      -- Insert the prescription with random medication and condition
      INSERT INTO prescriptions (
        provider_id, medication_id, condition_id, prescription_location, fill_location, 
        prescription_date, quantity, days_supply, refills
      ) VALUES (
        provider_record.id,
        (SELECT id FROM medications ORDER BY random() LIMIT 1),
        (SELECT id FROM conditions ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (SELECT id FROM geographic_regions WHERE type IN ('Metro', 'State') ORDER BY random() LIMIT 1),
        (current_date - (random() * 365)::integer * interval '1 day'),
        (30 + (random() * 60)::integer),
        (30 + (random() * 60)::integer),
        (random() * 3)::integer
      );
    END LOOP;
  END LOOP;
END $$;

-- Add regional prescription patterns
-- Northeast tends to prescribe newer medications
UPDATE prescriptions
SET medication_id = (
  CASE 
    WHEN random() < 0.4 THEN '60000000-0000-0000-0000-000000000008' -- Apixaban (newer anticoagulant)
    WHEN random() < 0.6 THEN '60000000-0000-0000-0000-000000000019' -- Semaglutide (newer diabetes med)
    WHEN random() < 0.8 THEN '60000000-0000-0000-0000-000000000027' -- Aripiprazole (atypical antipsychotic)
    ELSE medication_id
  END
)
WHERE prescription_location IN (
  SELECT id FROM geographic_regions 
  WHERE name IN ('New York', 'Massachusetts', 'Connecticut', 'New Jersey', 
                'New York-Newark-Jersey City', 'Boston-Cambridge-Newton')
)
AND random() < 0.3;

-- Southeast has higher rates of cardiovascular and metabolic prescriptions
UPDATE prescriptions
SET medication_id = (
  CASE 
    WHEN random() < 0.3 THEN '60000000-0000-0000-0000-000000000001' -- Lisinopril (hypertension)
    WHEN random() < 0.5 THEN '60000000-0000-0000-0000-000000000011' -- Metformin (diabetes)
    WHEN random() < 0.7 THEN '60000000-0000-0000-0000-000000000005' -- Atorvastatin (cholesterol)
    ELSE medication_id
  END
)
WHERE prescription_location IN (
  SELECT id FROM geographic_regions 
  WHERE name IN ('Florida', 'Georgia', 'Alabama', 'Mississippi',
                'Miami-Fort Lauderdale-Pompano Beach', 'Atlanta-Sandy Springs-Alpharetta')
)
AND random() < 0.3;

-- West coast has higher rates of newer and alternative medications
UPDATE prescriptions
SET medication_id = (
  CASE 
    WHEN random() < 0.3 THEN '60000000-0000-0000-0000-000000000019' -- Semaglutide (newer diabetes med)
    WHEN random() < 0.5 THEN '60000000-0000-0000-0000-000000000044' -- Gabapentin (pain, off-label for anxiety)
    WHEN random() < 0.7 THEN '60000000-0000-0000-0000-000000000038' -- Celecoxib (COX-2 inhibitor)
    ELSE medication_id
  END
)
WHERE prescription_location IN (
  SELECT id FROM geographic_regions 
  WHERE name IN ('California', 'Oregon', 'Washington',
                'Los Angeles-Long Beach-Anaheim', 'San Francisco-Oakland-Berkeley', 'Seattle-Tacoma-Bellevue')
)
AND random() < 0.3;

-- Midwest has higher traditional medication usage
UPDATE prescriptions
SET medication_id = (
  CASE 
    WHEN random() < 0.3 THEN '60000000-0000-0000-0000-000000000002' -- Metoprolol (beta blocker)
    WHEN random() < 0.5 THEN '60000000-0000-0000-0000-000000000006' -- Simvastatin (older statin)
    WHEN random() < 0.7 THEN '60000000-0000-0000-0000-000000000023' -- Fluoxetine (older SSRI)
    ELSE medication_id
  END
)
WHERE prescription_location IN (
  SELECT id FROM geographic_regions 
  WHERE name IN ('Illinois', 'Michigan', 'Ohio', 'Wisconsin',
                'Chicago-Naperville-Elgin', 'Detroit-Warren-Dearborn')
)
AND random() < 0.3;

-- Create seasonal patterns for respiratory conditions
UPDATE prescriptions
SET prescription_date = (
  CASE 
    -- Winter months (higher respiratory prescriptions)
    WHEN random() < 0.7 THEN (date_trunc('year', current_date) - interval '1 year' + interval '1 month' * ((random() * 3)::integer))
    -- Summer months (fewer respiratory prescriptions)
    ELSE (date_trunc('year', current_date) - interval '6 month' + interval '1 month' * ((random() * 3)::integer))
  END
)
WHERE condition_id IN ('50000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000020')
AND random() < 0.5;
