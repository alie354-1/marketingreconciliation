/*
 This migration adds user_id to campaigns table and creates a function 
 to copy sample data for new users
*/

-- Start transaction
BEGIN;

-- Add user_id column to campaigns table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id) NULL;
    RAISE NOTICE 'Added user_id column to campaigns table';
  ELSE
    RAISE NOTICE 'user_id column already exists in campaigns table';
  END IF;
END $$;

-- Create function to copy sample data for new users
CREATE OR REPLACE FUNCTION copy_sample_data_for_new_user(user_id UUID)
RETURNS VOID AS $$
DECLARE
  new_campaign_id UUID;
  campaign_rec RECORD;
  result_id UUID;
BEGIN
  -- Copy existing sample campaigns for the new user
  FOR campaign_rec IN 
    SELECT * FROM campaigns 
    WHERE (name LIKE 'CardioGuard%' OR name LIKE 'NeuroBalance%' OR name LIKE 'ImmunoTherapy%')
    AND (user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000')
    LIMIT 3
  LOOP
    -- Insert a copy of the campaign with the new user_id
    INSERT INTO campaigns (
      name, description, status, start_date, end_date, 
      targeting_metadata, user_id
    ) VALUES (
      campaign_rec.name,
      campaign_rec.description,
      campaign_rec.status,
      campaign_rec.start_date,
      campaign_rec.end_date,
      campaign_rec.targeting_metadata,
      user_id
    ) RETURNING id INTO new_campaign_id;
    
    -- If we have campaign results, copy those too
    INSERT INTO campaign_results (
      campaign_id, metrics, engagement_metrics, demographic_metrics,
      roi_metrics, prescription_metrics, report_date
    )
    SELECT 
      new_campaign_id, metrics, engagement_metrics, demographic_metrics,
      roi_metrics, prescription_metrics, report_date
    FROM campaign_results
    WHERE campaign_id = campaign_rec.id;
    
    -- If we have prescriptions, copy those too
    INSERT INTO prescriptions (
      campaign_id, medication_id, medication_name, medication_category,
      is_target, is_competitor, provider_id, provider_specialty, 
      provider_geographic_area, baseline_count, current_count, 
      change_count, change_percentage, baseline_period, current_period
    )
    SELECT 
      new_campaign_id, medication_id, medication_name, medication_category,
      is_target, is_competitor, provider_id, provider_specialty, 
      provider_geographic_area, baseline_count, current_count, 
      change_count, change_percentage, baseline_period, current_period
    FROM prescriptions
    WHERE campaign_id = campaign_rec.id;
  END LOOP;
  
  RAISE NOTICE 'Copied sample data for user %', user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with a sample UUID (won't actually create data)
DO $$
BEGIN
  RAISE NOTICE 'Function is ready to use with: SELECT copy_sample_data_for_new_user(''your-user-uuid'');';
END $$;

COMMIT;
