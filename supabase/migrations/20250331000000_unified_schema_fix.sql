/*
* Unified Schema Fix - 2025-03-31
* 
* This migration resolves two critical issues:
* 1. Prescription table column naming discrepancies (provider_region vs provider_geographic_area)
* 2. Creative templates table missing or misconfigured
*
* The script is idempotent and can be run multiple times safely.
*/

-- Start a transaction to ensure all changes succeed or fail together
BEGIN;

-- ========================================================
-- PART 1: Fix prescriptions table schema issues
-- ========================================================

-- Check if prescriptions table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescriptions') THEN
    -- Table exists, we need to check and fix its schema
    
    -- 1. Fix campaign_id column if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'campaign_id') THEN
      -- campaign_id column is missing entirely, add it
      ALTER TABLE prescriptions ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added missing campaign_id column to prescriptions table';
    END IF;
    
    -- 2. Fix region/geographic_area inconsistency
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'provider_geographic_area') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'provider_region') THEN
      -- provider_geographic_area exists but provider_region doesn't, so create provider_region as a synonym
      ALTER TABLE prescriptions ADD COLUMN provider_region TEXT;
      
      -- Copy data from geographic_area to region
      UPDATE prescriptions SET provider_region = provider_geographic_area;
      
      RAISE NOTICE 'Added provider_region column and synced data from provider_geographic_area';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'provider_region') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'provider_geographic_area') THEN
      -- provider_region exists but provider_geographic_area doesn't, so create geographic_area as a synonym
      ALTER TABLE prescriptions ADD COLUMN provider_geographic_area TEXT;
      
      -- Copy data from region to geographic_area
      UPDATE prescriptions SET provider_geographic_area = provider_region;
      
      RAISE NOTICE 'Added provider_geographic_area column and synced data from provider_region';
    END IF;
    
    -- 3. Add any missing indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'prescriptions' AND indexname = 'idx_prescriptions_campaign_id') THEN
      CREATE INDEX idx_prescriptions_campaign_id ON prescriptions(campaign_id);
      RAISE NOTICE 'Created missing index idx_prescriptions_campaign_id';
    END IF;
    
  ELSE
    -- Table doesn't exist, so create it with all required columns
    CREATE TABLE prescriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      medication_id TEXT NOT NULL,
      medication_name TEXT NOT NULL,
      medication_category TEXT,
      is_target BOOLEAN DEFAULT FALSE,
      is_competitor BOOLEAN DEFAULT FALSE,
      
      -- Provider demographics with both naming conventions
      provider_id TEXT NOT NULL,
      provider_specialty TEXT,
      provider_region TEXT,
      provider_geographic_area TEXT, -- Synonym for provider_region
      
      -- Prescription counts
      baseline_count INTEGER NOT NULL,
      current_count INTEGER NOT NULL,
      
      -- Derived metrics
      change_count INTEGER,
      change_percentage NUMERIC(10, 2),
      
      -- Time periods
      baseline_period TEXT,
      current_period TEXT,
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add indexes
    CREATE INDEX idx_prescriptions_campaign_id ON prescriptions(campaign_id);
    CREATE INDEX idx_prescriptions_medication_id ON prescriptions(medication_id);
    CREATE INDEX idx_prescriptions_provider_id ON prescriptions(provider_id);
    
    -- Add RLS policies for prescriptions
    ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
    
    -- Allow read access to authenticated users
    CREATE POLICY "Allow read access for authenticated users"
      ON prescriptions FOR SELECT
      TO authenticated
      USING (true);
    
    -- Allow insert, update, delete for service roles only
    CREATE POLICY "Allow all access for service role"
      ON prescriptions FOR ALL
      TO service_role
      USING (true);
      
    RAISE NOTICE 'Created prescriptions table with all required columns';
  END IF;
END $$;

-- Create trigger to keep region and geographic_area in sync
CREATE OR REPLACE FUNCTION sync_prescription_regions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If provider_region was updated and provider_geographic_area wasn't, sync it
    IF NEW.provider_region IS DISTINCT FROM OLD.provider_region AND NEW.provider_geographic_area IS NOT DISTINCT FROM OLD.provider_geographic_area THEN
      NEW.provider_geographic_area := NEW.provider_region;
    -- If provider_geographic_area was updated and provider_region wasn't, sync it
    ELSIF NEW.provider_geographic_area IS DISTINCT FROM OLD.provider_geographic_area AND NEW.provider_region IS NOT DISTINCT FROM OLD.provider_region THEN
      NEW.provider_region := NEW.provider_geographic_area;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_prescription_regions') THEN
    CREATE TRIGGER trigger_sync_prescription_regions
    BEFORE INSERT OR UPDATE ON prescriptions
    FOR EACH ROW 
    EXECUTE FUNCTION sync_prescription_regions();
    
    RAISE NOTICE 'Created trigger to keep prescription region fields in sync';
  END IF;
END $$;

-- ========================================================
-- PART 2: Fix creative_templates table issues
-- ========================================================

-- Check if creative_templates table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creative_templates') THEN
    -- Table doesn't exist, create it
    CREATE TABLE creative_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL, -- 'email', 'banner', 'video', etc.
      content JSONB NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies
    ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;
    
    -- Allow read access to authenticated users
    CREATE POLICY "Allow read access for authenticated users"
      ON creative_templates FOR SELECT
      TO authenticated
      USING (true);
    
    -- Allow insert, update, delete for service roles only
    CREATE POLICY "Allow all access for service role"
      ON creative_templates FOR ALL
      TO service_role
      USING (true);
      
    RAISE NOTICE 'Created creative_templates table';
    
    -- Insert sample data if the table was just created
    INSERT INTO creative_templates (name, description, type, content, metadata)
    VALUES
    (
      'Standard Email Template',
      'Generic email template with header, body, and footer sections',
      'email',
      '{"subject": "Important Information About Your Medication", "header": "<h1>{{medication_name}}</h1>", "body": "<p>Dear {{provider_name}},</p><p>We wanted to inform you about {{medication_name}} and its benefits for your patients.</p>", "footer": "<p>Contact us at support@example.com</p>"}',
      '{"supported_specialties": ["Primary Care", "Cardiology"], "target_regions": ["Northeast", "Midwest"]}'
    ),
    (
      'Banner Ad - Large',
      'Large banner advertisement for website placement',
      'banner',
      '{"width": 728, "height": 90, "html": "<div class=\"banner\"><img src=\"{{image_url}}\" /><h2>{{headline}}</h2><p>{{tagline}}</p></div>", "css": ".banner { display: flex; align-items: center; }"}',
      '{"platforms": ["web", "mobile"], "file_types": ["jpg", "png", "gif"]}'
    ),
    (
      'Product Video',
      'Product demonstration video template',
      'video',
      '{"duration": 120, "intro": "Introduction to {{medication_name}}", "sections": ["Problem", "Solution", "Benefits", "Call to Action"], "outro": "Ask your representative about {{medication_name}} today"}',
      '{"video_formats": ["mp4", "webm"], "max_file_size": "50MB"}'
    ),
    (
      'Social Media Post',
      'Template for social media updates',
      'social',
      '{"headline": "Introducing {{medication_name}}", "body": "Learn how {{medication_name}} can help your patients with {{condition}}.", "hashtags": ["#healthcare", "#medicine"], "cta": "Learn more at {{url}}"}',
      '{"platforms": ["twitter", "linkedin", "facebook"], "character_limit": 280}'
    );
    
    RAISE NOTICE 'Added sample creative_templates data';
  ELSE
    RAISE NOTICE 'creative_templates table already exists, skipping creation';
  END IF;
END $$;

-- Make sure creative_templates has all the required columns
DO $$
BEGIN
  -- Check if content column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_templates' AND column_name = 'content') THEN
    ALTER TABLE creative_templates ADD COLUMN content JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added missing content column to creative_templates';
  END IF;
  
  -- Check if metadata column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_templates' AND column_name = 'metadata') THEN
    ALTER TABLE creative_templates ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added missing metadata column to creative_templates';
  END IF;
  
  -- Check for is_active column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_templates' AND column_name = 'is_active') THEN
    ALTER TABLE creative_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added missing is_active column to creative_templates';
  END IF;
END $$;

-- Check if we need to add sample data
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  -- Count existing templates
  SELECT COUNT(*) INTO template_count FROM creative_templates;
  
  -- If no templates exist, add samples
  IF template_count = 0 THEN
    INSERT INTO creative_templates (name, description, type, content, metadata)
    VALUES
    (
      'Standard Email Template',
      'Generic email template with header, body, and footer sections',
      'email',
      '{"subject": "Important Information About Your Medication", "header": "<h1>{{medication_name}}</h1>", "body": "<p>Dear {{provider_name}},</p><p>We wanted to inform you about {{medication_name}} and its benefits for your patients.</p>", "footer": "<p>Contact us at support@example.com</p>"}',
      '{"supported_specialties": ["Primary Care", "Cardiology"], "target_regions": ["Northeast", "Midwest"]}'
    ),
    (
      'Banner Ad - Large',
      'Large banner advertisement for website placement',
      'banner',
      '{"width": 728, "height": 90, "html": "<div class=\"banner\"><img src=\"{{image_url}}\" /><h2>{{headline}}</h2><p>{{tagline}}</p></div>", "css": ".banner { display: flex; align-items: center; }"}',
      '{"platforms": ["web", "mobile"], "file_types": ["jpg", "png", "gif"]}'
    ),
    (
      'Product Video',
      'Product demonstration video template',
      'video',
      '{"duration": 120, "intro": "Introduction to {{medication_name}}", "sections": ["Problem", "Solution", "Benefits", "Call to Action"], "outro": "Ask your representative about {{medication_name}} today"}',
      '{"video_formats": ["mp4", "webm"], "max_file_size": "50MB"}'
    ),
    (
      'Social Media Post',
      'Template for social media updates',
      'social',
      '{"headline": "Introducing {{medication_name}}", "body": "Learn how {{medication_name}} can help your patients with {{condition}}.", "hashtags": ["#healthcare", "#medicine"], "cta": "Learn more at {{url}}"}',
      '{"platforms": ["twitter", "linkedin", "facebook"], "character_limit": 280}'
    );
    
    RAISE NOTICE 'Added sample data to empty creative_templates table';
  ELSE
    RAISE NOTICE 'creative_templates already has % rows of data', template_count;
  END IF;
END $$;

-- Commit all changes
COMMIT;

RAISE NOTICE 'Schema update completed successfully';
