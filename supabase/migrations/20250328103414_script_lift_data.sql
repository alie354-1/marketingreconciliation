-- Migration for campaign results and script lift data storage
-- This adds tables needed for storing generated results

-- Create script_lift_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.script_lift_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    medication_id TEXT NOT NULL,
    baseline INTEGER NOT NULL,
    projected INTEGER NOT NULL,
    lift_percentage NUMERIC(5,2) NOT NULL,
    confidence_score INTEGER NOT NULL,
    time_period TEXT NOT NULL,
    comparison_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_script_lift_campaign_id ON public.script_lift_data (campaign_id);
CREATE INDEX IF NOT EXISTS idx_script_lift_medication_id ON public.script_lift_data (medication_id);

-- Enable Row Level Security for script_lift_data
ALTER TABLE public.script_lift_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for script lift data - users can only see data for campaigns they created
CREATE POLICY script_lift_data_select_policy
    ON public.script_lift_data
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c 
            WHERE c.id = script_lift_data.campaign_id 
            AND c.created_by = auth.uid()
        )
    );

-- Create RLS policy for creating script lift data
CREATE POLICY script_lift_data_insert_policy
    ON public.script_lift_data
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaigns c 
            WHERE c.id = script_lift_data.campaign_id 
            AND c.created_by = auth.uid()
        )
    );

-- Make sure campaign_results table exists (it's likely already created in another migration)
CREATE TABLE IF NOT EXISTS public.campaign_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    metrics JSONB NOT NULL,
    engagement_metrics JSONB NOT NULL,
    demographic_metrics JSONB NOT NULL,
    roi_metrics JSONB NOT NULL,
    prescription_metrics JSONB NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for campaign_results
CREATE INDEX IF NOT EXISTS idx_campaign_results_campaign_id ON public.campaign_results (campaign_id);

-- Enable RLS on campaign_results if it doesn't already have it
ALTER TABLE public.campaign_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for campaign results if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'campaign_results' AND policyname = 'campaign_results_select_policy'
    ) THEN
        CREATE POLICY campaign_results_select_policy
            ON public.campaign_results
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.campaigns c 
                    WHERE c.id = campaign_results.campaign_id 
                    AND c.created_by = auth.uid()
                )
            );
    END IF;
END
$$;

-- Create RLS policy for inserting campaign results if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'campaign_results' AND policyname = 'campaign_results_insert_policy'
    ) THEN
        CREATE POLICY campaign_results_insert_policy
            ON public.campaign_results
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.campaigns c 
                    WHERE c.id = campaign_results.campaign_id 
                    AND c.created_by = auth.uid()
                )
            );
    END IF;
END
$$;

-- Add comment to explain the migration
COMMENT ON TABLE public.script_lift_data IS 'Stores medication-specific script lift data for campaigns';
COMMENT ON TABLE public.campaign_results IS 'Stores comprehensive campaign results including metrics and ROI analysis';
