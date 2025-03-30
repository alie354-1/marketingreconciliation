-- Generate provider data for prescription generation
-- This creates a realistic distribution of providers across specialties and regions

-- Run in transaction for safety
BEGIN;

-- Check if we need to add columns to providers table
DO $$
BEGIN
    -- If provider_id column doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'providers' AND column_name = 'provider_id'
    ) THEN
        ALTER TABLE providers ADD COLUMN provider_id TEXT UNIQUE;
    END IF;
    
    -- If name column doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'providers' AND column_name = 'name'
    ) THEN
        ALTER TABLE providers ADD COLUMN name TEXT;
    END IF;
    
    -- If prescribing_volume column doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'providers' AND column_name = 'prescribing_volume'
    ) THEN
        ALTER TABLE providers ADD COLUMN prescribing_volume TEXT DEFAULT 'medium';
    END IF;
END $$;

-- Create index on specialty and geographic_area for faster queries
CREATE INDEX IF NOT EXISTS idx_providers_specialty ON providers(specialty);
CREATE INDEX IF NOT EXISTS idx_providers_geographic_area ON providers(geographic_area);
CREATE INDEX IF NOT EXISTS idx_providers_prescribing_volume ON providers(prescribing_volume);

-- Instead of truncating (which has foreign key constraints), just add new data
-- First, check if we already have enough providers
DO $$
DECLARE
  provider_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO provider_count FROM providers;
  
  -- Only continue if we have fewer than 100 providers
  IF provider_count < 100 THEN
    RAISE NOTICE 'Adding new provider data (current count: %)', provider_count;
  ELSE
    RAISE NOTICE 'Sufficient provider data already exists (count: %)', provider_count;
    -- Exit the script early
    RETURN;
  END IF;
END $$;

-- Helper function to generate a random provider name
CREATE OR REPLACE FUNCTION generate_provider_name()
RETURNS TEXT AS $$
DECLARE
  first_names TEXT[] := ARRAY[
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
    'Lisa', 'Nancy', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol'
  ];
  last_names TEXT[] := ARRAY[
    'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
    'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
    'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King',
    'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter'
  ];
  suffixes TEXT[] := ARRAY['MD', 'DO', 'NP', 'PA', 'MD, PhD'];
  first_name TEXT;
  last_name TEXT;
  suffix TEXT;
BEGIN
  first_name := first_names[floor(random() * array_length(first_names, 1)) + 1];
  last_name := last_names[floor(random() * array_length(last_names, 1)) + 1];
  suffix := suffixes[floor(random() * array_length(suffixes, 1)) + 1];
  
  RETURN 'Dr. ' || first_name || ' ' || last_name || ', ' || suffix;
END;
$$ LANGUAGE plpgsql;

-- Create specialties array
DO $$
DECLARE
  specialties TEXT[] := ARRAY[
    'Cardiology', 'Endocrinology', 'Primary Care', 
    'Psychiatry', 'Neurology', 'Geriatric Medicine',
    'Oncology', 'Rheumatology', 'Gastroenterology', 'Dermatology'
  ];
  
  regions TEXT[] := ARRAY[
    'Northeast', 'Midwest', 'West', 'Southwest', 'Southeast', 'Northwest', 'Nationwide'
  ];
  
  volumes TEXT[] := ARRAY['high', 'medium', 'low'];
  practice_sizes TEXT[] := ARRAY['solo', 'small', 'medium', 'large', 'hospital'];
  
  specialty TEXT;
  region TEXT;
  volume TEXT;
  practice_size TEXT;
  provider_count INTEGER;
  i INTEGER;
  provider_id TEXT;
BEGIN
  -- Generate providers for each specialty
  FOREACH specialty IN ARRAY specialties
  LOOP
    -- Determine number of providers for this specialty (more for primary care, fewer for specialties)
    CASE specialty
      WHEN 'Primary Care' THEN provider_count := 60;
      WHEN 'Cardiology' THEN provider_count := 40;
      WHEN 'Psychiatry' THEN provider_count := 35;
      WHEN 'Neurology' THEN provider_count := 30;
      WHEN 'Oncology' THEN provider_count := 25;
      ELSE provider_count := 15; -- Other specialties
    END CASE;
    
    -- Generate providers for this specialty
    FOR i IN 1..provider_count
    LOOP
      -- Pick a region with bias (some specialties are more common in certain regions)
      IF specialty = 'Cardiology' AND random() < 0.6 THEN
        -- Cardiology is more common in Northeast and Midwest for our data
        IF random() < 0.5 THEN
          region := 'Northeast';
        ELSE
          region := 'Midwest';
        END IF;
      ELSIF specialty IN ('Psychiatry', 'Neurology') AND random() < 0.7 THEN
        -- Psychiatry and Neurology are more common in West and Southwest for our data
        IF random() < 0.5 THEN
          region := 'West';
        ELSE
          region := 'Southwest';
        END IF;
      ELSIF specialty IN ('Oncology', 'Rheumatology', 'Gastroenterology', 'Dermatology') THEN
        -- These specialties are distributed nationwide for our data
        region := regions[floor(random() * array_length(regions, 1)) + 1];
      ELSE
        -- Random region for other specialties
        region := regions[floor(random() * array_length(regions, 1)) + 1];
      END IF;
      
      -- Determine prescribing volume with specialty-specific patterns
      IF specialty IN ('Cardiology', 'Oncology') AND random() < 0.6 THEN
        -- Higher likelihood of high volume for these specialties
        volume := 'high';
      ELSIF specialty = 'Primary Care' THEN
        -- Primary care has a more even distribution
        IF random() < 0.33 THEN
          volume := 'high';
        ELSIF random() < 0.66 THEN
          volume := 'medium';
        ELSE
          volume := 'low';
        END IF;
      ELSE
        -- Random volume with bias toward medium
        IF random() < 0.3 THEN
          volume := 'high';
        ELSIF random() < 0.7 THEN
          volume := 'medium';
        ELSE
          volume := 'low';
        END IF;
      END IF;
      
      -- Generate practice size
      practice_size := practice_sizes[floor(random() * array_length(practice_sizes, 1)) + 1];
      
      -- Create provider ID with specialty prefix for easier identification
      provider_id := lower(substring(specialty from 1 for 3)) || '-' || 
                     lower(substring(region from 1 for 3)) || '-' ||
                     lower(volume) || '-' || 
                     floor(random() * 10000)::text;
      
      -- Insert provider
      INSERT INTO providers (
        provider_id, 
        name, 
        specialty, 
        geographic_area, -- Use geographic_area to match the existing schema
        prescribing_volume, 
        practice_size
      ) VALUES (
        provider_id,
        generate_provider_name(),
        specialty,
        region, -- Region value goes into geographic_area column
        volume,
        practice_size
      );
    END LOOP;
  END LOOP;
END $$;

-- Add RLS policies if needed
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users"
  ON providers FOR SELECT
  TO authenticated
  USING (true);

-- Allow all access for service role
CREATE POLICY "Allow all access for service role"
  ON providers FOR ALL
  TO service_role
  USING (true);

-- Show summary of providers generated
SELECT 
  specialty, 
  COUNT(*) as provider_count, 
  COUNT(*) FILTER (WHERE prescribing_volume = 'high') as high_volume,
  COUNT(*) FILTER (WHERE prescribing_volume = 'medium') as medium_volume,
  COUNT(*) FILTER (WHERE prescribing_volume = 'low') as low_volume
FROM providers
GROUP BY specialty
ORDER BY provider_count DESC;

-- Drop the helper function to clean up
DROP FUNCTION IF EXISTS generate_provider_name();

COMMIT;
