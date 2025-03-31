-- Add missing columns to medications and providers tables
-- This migration ensures that the columns referenced in the application code exist in the database

-- Check if name column exists in medications table, add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medications' AND column_name = 'name'
    ) THEN
        ALTER TABLE medications ADD COLUMN name TEXT;
        
        -- Update existing records with a default name based on id
        UPDATE medications SET name = 'Medication ' || id WHERE name IS NULL;
    END IF;
END
$$;

-- Check if geographic_area column exists in providers table, add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'providers' AND column_name = 'geographic_area'
    ) THEN
        ALTER TABLE providers ADD COLUMN geographic_area TEXT;
        
        -- Copy values from region column to geographic_area for existing records
        UPDATE providers SET geographic_area = region WHERE geographic_area IS NULL;
    END IF;
END
$$;

-- Create script_lift_data table if it doesn't exist
-- This table is used by the ScriptLiftComparison component
CREATE TABLE IF NOT EXISTS script_lift_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    baseline INTEGER NOT NULL,
    projected INTEGER NOT NULL,
    lift_percentage NUMERIC(5,2) NOT NULL,
    confidence_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample data to script_lift_data if the table is empty
INSERT INTO script_lift_data (campaign_id, baseline, projected, lift_percentage, confidence_score)
SELECT 
    id as campaign_id,
    FLOOR(RANDOM() * 5000 + 1000)::INTEGER as baseline,
    FLOOR(RANDOM() * 8000 + 5000)::INTEGER as projected,
    (RANDOM() * 20 + 5)::NUMERIC(5,2) as lift_percentage,
    (RANDOM() * 30 + 65)::INTEGER as confidence_score
FROM campaigns
WHERE NOT EXISTS (SELECT 1 FROM script_lift_data LIMIT 1)
LIMIT 10;

-- Ensure campaign_results table has the necessary structure
CREATE TABLE IF NOT EXISTS campaign_results (
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

-- Add sample data to campaign_results if the table is empty
INSERT INTO campaign_results (
    campaign_id, 
    metrics, 
    engagement_metrics, 
    demographic_metrics, 
    roi_metrics, 
    prescription_metrics
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
    ) as prescription_metrics
FROM campaigns
WHERE NOT EXISTS (SELECT 1 FROM campaign_results LIMIT 1)
LIMIT 10;
