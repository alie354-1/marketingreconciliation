-- Fix campaign results expansion issue
-- This migration ensures that the campaign_results table has the correct structure and data

-- First, check if the campaign_results table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'campaign_results'
    ) THEN
        -- Create the campaign_results table if it doesn't exist
        CREATE TABLE campaign_results (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
            engagement_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
            demographic_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
            roi_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
            prescription_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
            report_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Check if there's any data in the campaign_results table
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count FROM campaign_results;
    
    -- If there's no data, insert sample data for each campaign
    IF result_count = 0 THEN
        INSERT INTO campaign_results (
            campaign_id, 
            metrics, 
            engagement_metrics, 
            demographic_metrics, 
            roi_metrics, 
            prescription_metrics,
            report_date
        )
        SELECT 
            id as campaign_id,
            jsonb_build_object(
                'impressions', FLOOR(RANDOM() * 100000 + 50000),
                'clicks', FLOOR(RANDOM() * 5000 + 2500),
                'conversions', FLOOR(RANDOM() * 1000 + 500)
            ) as metrics,
            jsonb_build_object(
                'avg_time_on_page', FLOOR(RANDOM() * 60 + 30),
                'bounce_rate', FLOOR(RANDOM() * 40 + 20),
                'return_visits', FLOOR(RANDOM() * 100 + 50),
                'resource_downloads', FLOOR(RANDOM() * 50 + 20)
            ) as engagement_metrics,
            jsonb_build_object(
                'age_groups', jsonb_build_object(
                    '25-34', FLOOR(RANDOM() * 20 + 10),
                    '35-44', FLOOR(RANDOM() * 30 + 20),
                    '45-54', FLOOR(RANDOM() * 30 + 20),
                    '55-64', FLOOR(RANDOM() * 20 + 10),
                    '65+', FLOOR(RANDOM() * 10 + 5)
                ),
                'genders', jsonb_build_object(
                    'Male', FLOOR(RANDOM() * 60 + 40),
                    'Female', FLOOR(RANDOM() * 60 + 40)
                )
            ) as demographic_metrics,
            jsonb_build_object(
                'total_campaign_cost', FLOOR(RANDOM() * 20000 + 10000),
                'roi_percentage', FLOOR(RANDOM() * 100 + 100),
                'estimated_revenue_impact', FLOOR(RANDOM() * 50000 + 20000),
                'cost_per_click', (RANDOM() * 30 + 10)::NUMERIC(10,2),
                'cost_per_conversion', (RANDOM() * 300 + 100)::NUMERIC(10,2),
                'cost_per_impression', (RANDOM() * 2 + 0.5)::NUMERIC(10,2),
                'lifetime_value_impact', FLOOR(RANDOM() * 100000 + 50000)
            ) as roi_metrics,
            jsonb_build_object(
                'new_prescriptions', FLOOR(RANDOM() * 100 + 50),
                'prescription_renewals', FLOOR(RANDOM() * 200 + 100),
                'market_share_change', (RANDOM() * 5 + 1)::NUMERIC(10,2),
                'patient_adherence_rate', FLOOR(RANDOM() * 30 + 50),
                'total_prescription_change', (RANDOM() * 20 + 5)::NUMERIC(10,2),
                'prescription_by_region', jsonb_build_object(
                    'Northeast', FLOOR(RANDOM() * 40 + 20),
                    'Southeast', FLOOR(RANDOM() * 30 + 15),
                    'Midwest', FLOOR(RANDOM() * 25 + 10),
                    'Southwest', FLOOR(RANDOM() * 20 + 10),
                    'West', FLOOR(RANDOM() * 20 + 10)
                ),
                'prescription_by_specialty', jsonb_build_object(
                    'Primary Care', FLOOR(RANDOM() * 50 + 30),
                    'Cardiology', FLOOR(RANDOM() * 30 + 10),
                    'Neurology', FLOOR(RANDOM() * 20 + 10),
                    'Endocrinology', FLOOR(RANDOM() * 25 + 15),
                    'Other', FLOOR(RANDOM() * 15 + 5)
                )
            ) as prescription_metrics,
            (CURRENT_DATE - (FLOOR(RANDOM() * 30)::INTEGER || ' days')::INTERVAL)::DATE as report_date
        FROM campaigns;
        
        -- Add historical data for each campaign (3 months of data)
        INSERT INTO campaign_results (
            campaign_id, 
            metrics, 
            engagement_metrics, 
            demographic_metrics, 
            roi_metrics, 
            prescription_metrics,
            report_date
        )
        SELECT 
            id as campaign_id,
            jsonb_build_object(
                'impressions', FLOOR(RANDOM() * 80000 + 40000),
                'clicks', FLOOR(RANDOM() * 4000 + 2000),
                'conversions', FLOOR(RANDOM() * 800 + 400)
            ) as metrics,
            jsonb_build_object(
                'avg_time_on_page', FLOOR(RANDOM() * 55 + 25),
                'bounce_rate', FLOOR(RANDOM() * 45 + 25),
                'return_visits', FLOOR(RANDOM() * 90 + 40),
                'resource_downloads', FLOOR(RANDOM() * 40 + 15)
            ) as engagement_metrics,
            jsonb_build_object(
                'age_groups', jsonb_build_object(
                    '25-34', FLOOR(RANDOM() * 20 + 10),
                    '35-44', FLOOR(RANDOM() * 30 + 20),
                    '45-54', FLOOR(RANDOM() * 30 + 20),
                    '55-64', FLOOR(RANDOM() * 20 + 10),
                    '65+', FLOOR(RANDOM() * 10 + 5)
                ),
                'genders', jsonb_build_object(
                    'Male', FLOOR(RANDOM() * 60 + 40),
                    'Female', FLOOR(RANDOM() * 60 + 40)
                )
            ) as demographic_metrics,
            jsonb_build_object(
                'total_campaign_cost', FLOOR(RANDOM() * 18000 + 9000),
                'roi_percentage', FLOOR(RANDOM() * 90 + 90),
                'estimated_revenue_impact', FLOOR(RANDOM() * 45000 + 18000),
                'cost_per_click', (RANDOM() * 28 + 9)::NUMERIC(10,2),
                'cost_per_conversion', (RANDOM() * 280 + 90)::NUMERIC(10,2),
                'cost_per_impression', (RANDOM() * 1.8 + 0.4)::NUMERIC(10,2),
                'lifetime_value_impact', FLOOR(RANDOM() * 90000 + 45000)
            ) as roi_metrics,
            jsonb_build_object(
                'new_prescriptions', FLOOR(RANDOM() * 90 + 45),
                'prescription_renewals', FLOOR(RANDOM() * 180 + 90),
                'market_share_change', (RANDOM() * 4.5 + 0.9)::NUMERIC(10,2),
                'patient_adherence_rate', FLOOR(RANDOM() * 28 + 45),
                'total_prescription_change', (RANDOM() * 18 + 4.5)::NUMERIC(10,2),
                'prescription_by_region', jsonb_build_object(
                    'Northeast', FLOOR(RANDOM() * 35 + 18),
                    'Southeast', FLOOR(RANDOM() * 28 + 14),
                    'Midwest', FLOOR(RANDOM() * 22 + 9),
                    'Southwest', FLOOR(RANDOM() * 18 + 9),
                    'West', FLOOR(RANDOM() * 18 + 9)
                ),
                'prescription_by_specialty', jsonb_build_object(
                    'Primary Care', FLOOR(RANDOM() * 45 + 28),
                    'Cardiology', FLOOR(RANDOM() * 28 + 9),
                    'Neurology', FLOOR(RANDOM() * 18 + 9),
                    'Endocrinology', FLOOR(RANDOM() * 22 + 14),
                    'Other', FLOOR(RANDOM() * 14 + 4)
                )
            ) as prescription_metrics,
            (CURRENT_DATE - (FLOOR(RANDOM() * 30 + 30)::INTEGER || ' days')::INTERVAL)::DATE as report_date
        FROM campaigns;
        
        -- Add even older historical data
        INSERT INTO campaign_results (
            campaign_id, 
            metrics, 
            engagement_metrics, 
            demographic_metrics, 
            roi_metrics, 
            prescription_metrics,
            report_date
        )
        SELECT 
            id as campaign_id,
            jsonb_build_object(
                'impressions', FLOOR(RANDOM() * 60000 + 30000),
                'clicks', FLOOR(RANDOM() * 3000 + 1500),
                'conversions', FLOOR(RANDOM() * 600 + 300)
            ) as metrics,
            jsonb_build_object(
                'avg_time_on_page', FLOOR(RANDOM() * 50 + 20),
                'bounce_rate', FLOOR(RANDOM() * 50 + 30),
                'return_visits', FLOOR(RANDOM() * 80 + 30),
                'resource_downloads', FLOOR(RANDOM() * 30 + 10)
            ) as engagement_metrics,
            jsonb_build_object(
                'age_groups', jsonb_build_object(
                    '25-34', FLOOR(RANDOM() * 20 + 10),
                    '35-44', FLOOR(RANDOM() * 30 + 20),
                    '45-54', FLOOR(RANDOM() * 30 + 20),
                    '55-64', FLOOR(RANDOM() * 20 + 10),
                    '65+', FLOOR(RANDOM() * 10 + 5)
                ),
                'genders', jsonb_build_object(
                    'Male', FLOOR(RANDOM() * 60 + 40),
                    'Female', FLOOR(RANDOM() * 60 + 40)
                )
            ) as demographic_metrics,
            jsonb_build_object(
                'total_campaign_cost', FLOOR(RANDOM() * 15000 + 8000),
                'roi_percentage', FLOOR(RANDOM() * 80 + 80),
                'estimated_revenue_impact', FLOOR(RANDOM() * 40000 + 15000),
                'cost_per_click', (RANDOM() * 25 + 8)::NUMERIC(10,2),
                'cost_per_conversion', (RANDOM() * 250 + 80)::NUMERIC(10,2),
                'cost_per_impression', (RANDOM() * 1.5 + 0.3)::NUMERIC(10,2),
                'lifetime_value_impact', FLOOR(RANDOM() * 80000 + 40000)
            ) as roi_metrics,
            jsonb_build_object(
                'new_prescriptions', FLOOR(RANDOM() * 80 + 40),
                'prescription_renewals', FLOOR(RANDOM() * 160 + 80),
                'market_share_change', (RANDOM() * 4 + 0.8)::NUMERIC(10,2),
                'patient_adherence_rate', FLOOR(RANDOM() * 25 + 40),
                'total_prescription_change', (RANDOM() * 15 + 4)::NUMERIC(10,2),
                'prescription_by_region', jsonb_build_object(
                    'Northeast', FLOOR(RANDOM() * 30 + 15),
                    'Southeast', FLOOR(RANDOM() * 25 + 12),
                    'Midwest', FLOOR(RANDOM() * 20 + 8),
                    'Southwest', FLOOR(RANDOM() * 15 + 8),
                    'West', FLOOR(RANDOM() * 15 + 8)
                ),
                'prescription_by_specialty', jsonb_build_object(
                    'Primary Care', FLOOR(RANDOM() * 40 + 25),
                    'Cardiology', FLOOR(RANDOM() * 25 + 8),
                    'Neurology', FLOOR(RANDOM() * 15 + 8),
                    'Endocrinology', FLOOR(RANDOM() * 20 + 12),
                    'Other', FLOOR(RANDOM() * 12 + 3)
                )
            ) as prescription_metrics,
            (CURRENT_DATE - (FLOOR(RANDOM() * 30 + 60)::INTEGER || ' days')::INTERVAL)::DATE as report_date
        FROM campaigns;
    END IF;
END
$$;

-- Create script_lift_data table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'script_lift_data'
    ) THEN
        CREATE TABLE script_lift_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            baseline INTEGER NOT NULL,
            projected INTEGER NOT NULL,
            lift_percentage NUMERIC(5,2) NOT NULL,
            confidence_score INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Check if there's any data in the script_lift_data table
DO $$
DECLARE
    lift_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lift_count FROM script_lift_data;
    
    -- If there's no data, insert sample data for each campaign
    IF lift_count = 0 THEN
        INSERT INTO script_lift_data (
            campaign_id,
            baseline,
            projected,
            lift_percentage,
            confidence_score
        )
        SELECT 
            id as campaign_id,
            FLOOR(RANDOM() * 5000 + 1000)::INTEGER as baseline,
            FLOOR(RANDOM() * 8000 + 5000)::INTEGER as projected,
            (RANDOM() * 20 + 5)::NUMERIC(5,2) as lift_percentage,
            (RANDOM() * 30 + 65)::INTEGER as confidence_score
        FROM campaigns;
    END IF;
END
$$;
