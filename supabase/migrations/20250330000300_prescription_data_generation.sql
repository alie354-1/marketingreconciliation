/*
 This script generates prescription data for medication tracking
 It creates sample data for campaign performance analysis
*/

-- Start transaction
BEGIN;

-- Ensure campaigns table exists before creating prescriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    CREATE TABLE campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      start_date DATE,
      end_date DATE,
      targeting_metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Insert sample campaign if none exists
    INSERT INTO campaigns (name, description, status, start_date, end_date, targeting_metadata)
    VALUES (
      'CardioGuard Plus Launch',
      'Launch campaign for CardioGuard Plus cardiovascular medication',
      'active',
      '2025-03-01'::date,
      '2025-05-31'::date,
      '{
        "target_specialties": ["Cardiology", "Endocrinology", "Primary Care"],
        "target_regions": ["Northeast", "Midwest"],
        "campaign_phases": [
          {"phase": 1, "duration_days": 15, "target_lift": 10},
          {"phase": 2, "duration_days": 15, "target_lift": 15},
          {"phase": 3, "duration_days": 30, "target_lift": 20},
          {"phase": 4, "duration_days": 30, "target_lift": 25}
        ]
      }'::jsonb
    );
  END IF;
END $$;

-- Helper function to get campaign IDs by name
CREATE OR REPLACE FUNCTION get_campaign_id(campaign_name TEXT)
RETURNS UUID AS $$
DECLARE
  campaign_id UUID;
BEGIN
  SELECT id INTO campaign_id FROM campaigns WHERE name = campaign_name LIMIT 1;
  RETURN campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Create prescriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  medication_id UUID,
  medication_name TEXT,
  medication_category TEXT,
  is_target BOOLEAN DEFAULT FALSE,
  is_competitor BOOLEAN DEFAULT FALSE,
  provider_id TEXT,
  provider_specialty TEXT,
  provider_geographic_area TEXT,
  baseline_count INTEGER DEFAULT 0,
  current_count INTEGER DEFAULT 0,
  change_count INTEGER DEFAULT 0,
  change_percentage NUMERIC DEFAULT 0,
  baseline_period TEXT,
  current_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_campaign_id ON prescriptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_id ON prescriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medication_id ON prescriptions(medication_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_is_target ON prescriptions(is_target);

-- Helper function to get medication ID by code
CREATE OR REPLACE FUNCTION get_medication_id_by_code(medication_code TEXT)
RETURNS UUID AS $$
DECLARE
  medication_id UUID;
BEGIN
  SELECT id INTO medication_id FROM medications WHERE code = medication_code;
  IF medication_id IS NULL THEN
    -- Fallback to search by name
    SELECT id INTO medication_id FROM medications WHERE name = 
      CASE medication_code
        WHEN 'med-cardioguard-001' THEN 'CardioGuard Plus'
        WHEN 'med-neurobalance-001' THEN 'NeuroBalance'
        WHEN 'med-immunotherapy-001' THEN 'ImmunoTherapy 5'
        ELSE medication_code
      END;
  END IF;
  RETURN medication_id;
END;
$$ LANGUAGE plpgsql;

-- Generate sample prescriptions for each campaign
DO $$
DECLARE
  campaign_id UUID;
  medication_id UUID;
  provider_rec RECORD;
  med_name TEXT;
  baseline_count INTEGER;
  current_count INTEGER;
  change_count INTEGER;
  change_pct NUMERIC;
  prescription_count INTEGER;
BEGIN
  -- Check if we already have prescription data
  SELECT COUNT(*) INTO prescription_count FROM prescriptions;
  
  -- Only proceed with generating data if we don't have enough
  IF prescription_count > 100 THEN
    RAISE NOTICE 'Sufficient prescription data already exists (count: %)', prescription_count;
    RETURN; -- Exit early
  ELSE
    RAISE NOTICE 'Generating prescription data (current count: %)', prescription_count;
    -- Delete existing prescriptions if there are just a few to avoid duplicates
    IF prescription_count > 0 AND prescription_count < 50 THEN
      DELETE FROM prescriptions;
    END IF;
  END IF;

  -- Get campaign IDs
  campaign_id := get_campaign_id('CardioGuard Plus Launch');
  
  -- Skip if no campaign_id found
  IF campaign_id IS NULL THEN
    RAISE NOTICE 'No campaign found with name CardioGuard Plus Launch. Skipping prescription generation.';
    RETURN;
  END IF;
  
  medication_id := get_medication_id_by_code('med-cardioguard-001');
  
  -- Verify that we have a medication ID
  IF medication_id IS NULL THEN
    -- Insert default medication if none exists
    INSERT INTO medications (id, name, category, description)
    VALUES (gen_random_uuid(), 'CardioGuard Plus', 'Cardiovascular', 'Advanced cardiovascular therapy')
    RETURNING id INTO medication_id;
  END IF;
  
  -- Get medication name
  SELECT name INTO med_name FROM medications WHERE id = medication_id;
  
  -- Skip if no providers found
  DECLARE
    provider_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO provider_count FROM providers;
    IF provider_count = 0 THEN
      RAISE NOTICE 'No providers found. Skipping prescription generation.';
      RETURN;
    END IF;
  END;
  
  -- Generate prescription data for each provider
  FOR provider_rec IN (SELECT * FROM providers LIMIT 100)
  LOOP
    -- Generate random baseline counts
    baseline_count := 10 + floor(random() * 40)::int;
    
    -- Calculate an uplift of 10-30%
    current_count := baseline_count * (1 + (0.1 + random() * 0.2));
    change_count := current_count - baseline_count;
    change_pct := (change_count::numeric / baseline_count) * 100;
    
    -- Insert prescription record
    INSERT INTO prescriptions (
      campaign_id, medication_id, medication_name, medication_category,
      is_target, provider_id, provider_specialty, provider_geographic_area,
      baseline_count, current_count, change_count, change_percentage,
      baseline_period, current_period
    ) VALUES (
      campaign_id, 
      medication_id, 
      med_name, 
      'Cardiovascular',
      TRUE, 
      provider_rec.provider_id, 
      provider_rec.specialty, 
      provider_rec.geographic_area,
      baseline_count, 
      current_count, 
      change_count, 
      change_pct,
      '2025-02-01_2025-02-28', 
      '2025-03-01_2025-03-28'
    );
  END LOOP;
  
  -- Log prescription records created
  RAISE NOTICE 'Prescription data generated successfully';
END $$;

-- Create view for campaign performance analysis
DO $$
BEGIN
  -- Drop view if it exists
  DROP VIEW IF EXISTS campaign_lift_view;
  
  -- Create view
  CREATE VIEW campaign_lift_view AS
  SELECT
    c.name AS campaign_name,
    p.medication_name,
    p.provider_specialty,
    p.provider_geographic_area,
    AVG(p.change_percentage) AS avg_lift,
    SUM(p.current_count) AS total_prescriptions,
    COUNT(DISTINCT p.provider_id) AS provider_count
  FROM
    prescriptions p
  JOIN
    campaigns c ON p.campaign_id = c.id
  WHERE
    p.is_target = TRUE
  GROUP BY
    c.name, p.medication_name, p.provider_specialty, p.provider_geographic_area
  ORDER BY
    avg_lift DESC;
END $$;
  
-- Clean up helper functions
DROP FUNCTION IF EXISTS get_campaign_id(TEXT);
DROP FUNCTION IF EXISTS get_medication_id_by_code(TEXT);

-- Return data summary
SELECT 
  COUNT(*) AS total_prescriptions,
  COUNT(DISTINCT provider_id) AS total_providers,
  COUNT(DISTINCT medication_id) AS total_medications
FROM prescriptions;

COMMIT;
