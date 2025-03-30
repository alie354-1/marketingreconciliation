/*
 This script creates needed tables for prescriptions without complex dependencies
 It focuses on basic structure needed for the application
*/

-- Start transaction
BEGIN;

-- First, check if campaigns table exists and create it if not
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
    
    -- Insert a sample campaign only if table was just created
    INSERT INTO campaigns (name, description, status, start_date, end_date)
    VALUES (
      'CardioGuard Plus Launch',
      'Launch campaign for CardioGuard Plus cardiovascular medication',
      'active',
      '2025-03-01'::date,
      '2025-05-31'::date
    );
    
    RAISE NOTICE 'Created campaigns table with sample data';
  END IF;
END $$;

-- Now create prescriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescriptions') THEN
    CREATE TABLE prescriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID,
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
    
    -- Create indexes (safe to call)
    CREATE INDEX IF NOT EXISTS idx_prescriptions_campaign_id ON prescriptions(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_id ON prescriptions(provider_id);
    
    RAISE NOTICE 'Created prescriptions table';
  END IF;
END $$;

-- Add some sample data if no prescriptions exist
DO $$
DECLARE
  campaign_uuid UUID;
  provider_count INTEGER;
  prescription_count INTEGER;
BEGIN
  -- Count existing prescriptions
  SELECT COUNT(*) INTO prescription_count FROM prescriptions;
  
  -- Only add sample data if no prescriptions exist
  IF prescription_count > 0 THEN
    RAISE NOTICE 'Prescriptions table already has data (count: %)', prescription_count;
    RETURN;
  END IF;
  
  -- Get campaign ID
  SELECT id INTO campaign_uuid FROM campaigns WHERE name = 'CardioGuard Plus Launch' LIMIT 1;
  
  -- Insert a few sample prescription records
  INSERT INTO prescriptions (
    campaign_id, medication_name, medication_category,
    is_target, provider_specialty, provider_geographic_area,
    baseline_count, current_count, change_count, change_percentage,
    baseline_period, current_period
  ) VALUES 
  (
    campaign_uuid, 
    'CardioGuard Plus', 
    'Cardiovascular',
    TRUE, 
    'Cardiology', 
    'Northeast',
    50, 
    65, 
    15, 
    30,
    '2025-02-01_2025-02-28', 
    '2025-03-01_2025-03-28'
  ),
  (
    campaign_uuid, 
    'CardioGuard Plus', 
    'Cardiovascular',
    TRUE, 
    'Cardiology', 
    'Midwest',
    45, 
    58, 
    13, 
    28.9,
    '2025-02-01_2025-02-28', 
    '2025-03-01_2025-03-28'
  ),
  (
    campaign_uuid, 
    'CardioGuard Plus', 
    'Cardiovascular',
    TRUE, 
    'Primary Care', 
    'Northeast',
    30, 
    35, 
    5, 
    16.7,
    '2025-02-01_2025-02-28', 
    '2025-03-01_2025-03-28'
  );
  
  RAISE NOTICE 'Added sample prescription data';
END $$;

-- Add foreign key constraint ONLY if both tables exist and have needed columns
DO $$
BEGIN
  -- First remove the constraint if it exists
  BEGIN
    ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_campaign_id_fkey;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
  END;
  
  -- Now add it with proper checks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescriptions') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'id') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'campaign_id') THEN
    
    ALTER TABLE prescriptions 
    ADD CONSTRAINT prescriptions_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key constraint for prescriptions table';
  END IF;
END $$;

COMMIT;
