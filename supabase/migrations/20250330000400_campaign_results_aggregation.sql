/*
 This script creates the campaign_results table and aggregation function
 It safely handles missing tables and columns
*/

-- Start transaction
BEGIN;

-- First, check if campaign_results table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_results') THEN
    CREATE TABLE campaign_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID,
      metrics JSONB DEFAULT '{}'::jsonb,
      engagement_metrics JSONB DEFAULT '{}'::jsonb,
      demographic_metrics JSONB DEFAULT '{}'::jsonb,
      roi_metrics JSONB DEFAULT '{}'::jsonb,
      prescription_metrics JSONB DEFAULT '{}'::jsonb,
      report_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Create index
    CREATE INDEX idx_campaign_results_campaign_id ON campaign_results(campaign_id);
    
    RAISE NOTICE 'Created campaign_results table';
  END IF;
END $$;

-- Function to get campaign IDs by name (reusing the function pattern)
CREATE OR REPLACE FUNCTION get_campaign_id(campaign_name TEXT)
RETURNS UUID AS $$
DECLARE
  campaign_id UUID;
BEGIN
  SELECT id INTO campaign_id FROM campaigns WHERE name = campaign_name LIMIT 1;
  RETURN campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate campaign results for a campaign
CREATE OR REPLACE FUNCTION generate_campaign_results(campaign_id UUID)
RETURNS UUID AS $$
DECLARE
  -- Result record ID
  result_id UUID;
  
  -- Aggregated metrics
  total_scripts INTEGER;
  target_scripts INTEGER;
  competitor_scripts INTEGER;
  avg_target_lift NUMERIC;
  avg_competitor_decline NUMERIC;
  provider_count INTEGER;
  script_ratio NUMERIC;
  roi_multiplier NUMERIC;
  
  -- Demographic breakdowns
  specialty_breakdown JSONB;
  region_breakdown JSONB;
  
  -- Date variables
  report_date DATE;
BEGIN
  -- Get the campaign's end date or current date for the report date
  SELECT 
    COALESCE(
      end_date, 
      CASE 
        WHEN status = 'completed' THEN end_date
        ELSE CURRENT_DATE
      END
    ) INTO report_date
  FROM campaigns
  WHERE id = campaign_id;
  
  -- Count total providers
  SELECT 
    COUNT(DISTINCT provider_id) INTO provider_count
  FROM prescriptions
  WHERE campaign_id = generate_campaign_results.campaign_id;
  
  -- Set default values for metrics
  total_scripts := 0;
  target_scripts := 0;
  competitor_scripts := 0;
  avg_target_lift := 0;
  avg_competitor_decline := 0;
  
  -- Check if prescriptions table exists and has the columns we need
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prescriptions' AND column_name = 'current_count'
  ) THEN
    -- Calculate total scripts
    BEGIN
      SELECT 
        COALESCE(SUM(current_count), 0) INTO total_scripts
      FROM prescriptions
      WHERE campaign_id = generate_campaign_results.campaign_id;
      
      -- Calculate target medication scripts
      SELECT 
        COALESCE(SUM(current_count), 0),
        COALESCE(AVG(change_percentage), 0)
      INTO 
        target_scripts,
        avg_target_lift
      FROM prescriptions
      WHERE 
        campaign_id = generate_campaign_results.campaign_id AND
        is_target = TRUE;
      
      -- Calculate competitor medication scripts
      SELECT 
        COALESCE(SUM(current_count), 0),
        COALESCE(AVG(change_percentage), 0)
      INTO 
        competitor_scripts,
        avg_competitor_decline
      FROM prescriptions
      WHERE 
        campaign_id = generate_campaign_results.campaign_id AND
        is_competitor = TRUE;
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with default values
      RAISE NOTICE 'Error calculating prescription metrics: %', SQLERRM;
    END;
  END IF;
  
  -- Calculate script ratio (target vs competitors)
  IF competitor_scripts > 0 THEN
    script_ratio := target_scripts::NUMERIC / competitor_scripts;
  ELSE
    script_ratio := NULL;
  END IF;
  
  -- Calculate ROI multiplier (simply for demonstration)
  IF avg_target_lift > 0 THEN
    -- Simple formula: ROI multiplier increases with target lift and decreases with competitor decline
    roi_multiplier := (1 + (avg_target_lift / 100)) * 10;
  ELSE
    roi_multiplier := 1;
  END IF;
  
  -- Create specialty breakdown
  BEGIN
    SELECT jsonb_object_agg(provider_specialty, script_count)
    INTO specialty_breakdown
    FROM (
      SELECT 
        provider_specialty, 
        SUM(current_count) as script_count
      FROM prescriptions
      WHERE campaign_id = generate_campaign_results.campaign_id
      GROUP BY provider_specialty
      ORDER BY script_count DESC
    ) as specialty_counts;
  EXCEPTION WHEN OTHERS THEN
    specialty_breakdown := '{}'::jsonb;
  END;
  
  -- Create region breakdown (using geographic_area instead of region)
  BEGIN
    SELECT jsonb_object_agg(provider_geographic_area, script_count)
    INTO region_breakdown
    FROM (
      SELECT 
        provider_geographic_area, 
        SUM(current_count) as script_count
      FROM prescriptions
      WHERE campaign_id = generate_campaign_results.campaign_id
      GROUP BY provider_geographic_area
      ORDER BY script_count DESC
    ) as region_counts;
  EXCEPTION WHEN OTHERS THEN
    region_breakdown := '{}'::jsonb;
  END;
  
  -- Delete existing results for this campaign to avoid duplicates
  DELETE FROM campaign_results cr
  WHERE cr.campaign_id = generate_campaign_results.campaign_id;
  
  -- Create result ID
  result_id := gen_random_uuid();
  
  -- Create the campaign_results record
  INSERT INTO campaign_results (
    id,
    campaign_id,
    metrics,
    engagement_metrics,
    demographic_metrics,
    roi_metrics,
    prescription_metrics,
    report_date,
    created_at
  ) VALUES (
    result_id,
    campaign_id,
    -- Basic metrics (impressions, clicks, conversions)
    jsonb_build_object(
      'impressions', (provider_count * 25), -- Assume 25 impressions per provider
      'clicks', (provider_count * 5), -- Assume 5 clicks per provider
      'conversions', (provider_count * 0.8)::INTEGER -- Assume 80% conversion rate
    ),
    
    -- Engagement metrics
    jsonb_build_object(
      'avg_time_on_page', 120 + floor(random() * 60), -- 2-3 minutes
      'bounce_rate', 15 + (random() * 10), -- 15-25%
      'return_visits', provider_count * 0.4, -- 40% return rate
      'resource_downloads', provider_count * 0.3 -- 30% download rate
    ),
    
    -- Demographic metrics
    jsonb_build_object(
      'age_groups', jsonb_build_object(
        '20-35', ROUND(provider_count * 0.2),
        '36-45', ROUND(provider_count * 0.3),
        '46-55', ROUND(provider_count * 0.3),
        '55+', ROUND(provider_count * 0.2)
      ),
      'genders', jsonb_build_object(
        'male', ROUND(provider_count * 0.65),
        'female', ROUND(provider_count * 0.35)
      ),
      'specialties', COALESCE(specialty_breakdown, '{}'::jsonb)
    ),
    
    -- ROI metrics
    jsonb_build_object(
      'total_campaign_cost', 50000 + floor(random() * 20000), -- Between $50-70k
      'roi_percentage', (avg_target_lift * roi_multiplier * 0.8), -- Calculate ROI based on lift
      'estimated_revenue_impact', target_scripts * 150, -- $150 per script average
      'cost_per_click', 25 + round(random() * 15), -- $25-40 CPC
      'cost_per_conversion', 120 + round(random() * 50), -- $120-170 CPA
      'cost_per_impression', 3 + round(random() * 2), -- $3-5 CPM
      'lifetime_value_impact', target_scripts * 450 -- $450 lifetime value
    ),
    
    -- Prescription metrics
    jsonb_build_object(
      'new_prescriptions', target_scripts * 0.3, -- 30% are new
      'prescription_renewals', target_scripts * 0.7, -- 70% are renewals
      'market_share_change', avg_target_lift * 0.4, -- 40% of lift translates to market share
      'patient_adherence_rate', 75 + (random() * 15), -- 75-90% adherence
      'total_prescription_change', target_scripts - (target_scripts / (1 + (avg_target_lift/100))),
      'prescription_by_region', COALESCE(region_breakdown, '{}'::jsonb),
      'prescription_by_specialty', COALESCE(specialty_breakdown, '{}'::jsonb)
    ),
    
    -- Report date
    COALESCE(report_date, CURRENT_DATE),
    
    -- Created timestamp
    now()
  );
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Generate campaign results for all available campaigns
DO $$
DECLARE
  campaign_rec RECORD;
  result_id UUID;
BEGIN
  -- Loop through all campaigns
  FOR campaign_rec IN SELECT id, name FROM campaigns 
  LOOP
    -- Generate results for this campaign
    result_id := generate_campaign_results(campaign_rec.id);
    RAISE NOTICE 'Generated campaign results for %: %', campaign_rec.name, result_id;
  END LOOP;
END $$;

-- Clean up helper functions
DROP FUNCTION IF EXISTS get_campaign_id(TEXT);
DROP FUNCTION IF EXISTS generate_campaign_results(UUID);

-- Display summary of campaign results
SELECT 
  c.name as campaign_name,
  cr.report_date,
  cr.metrics->>'impressions' as impressions,
  cr.metrics->>'clicks' as clicks,
  cr.metrics->>'conversions' as conversions,
  cr.roi_metrics->>'roi_percentage' as roi_percentage,
  cr.roi_metrics->>'estimated_revenue_impact' as revenue_impact,
  cr.prescription_metrics->>'new_prescriptions' as new_prescriptions,
  cr.prescription_metrics->>'market_share_change' as market_share_change
FROM campaign_results cr
JOIN campaigns c ON cr.campaign_id = c.id
ORDER BY c.name;

COMMIT;
