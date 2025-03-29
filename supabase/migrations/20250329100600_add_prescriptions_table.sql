-- Create prescriptions table for tracking prescription data
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  medication_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  medication_category TEXT,
  is_target BOOLEAN DEFAULT FALSE,
  is_competitor BOOLEAN DEFAULT FALSE,
  
  -- Provider demographics
  provider_id TEXT NOT NULL,
  provider_specialty TEXT,
  provider_region TEXT,
  
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_campaign_id ON public.prescriptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medication_id ON public.prescriptions(medication_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_id ON public.prescriptions(provider_id);

-- Add RLS policies for prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users"
  ON public.prescriptions FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert, update, delete for service roles only
CREATE POLICY "Allow all access for service role"
  ON public.prescriptions FOR ALL
  TO service_role
  USING (true);
