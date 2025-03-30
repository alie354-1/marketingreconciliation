/*
 This script creates only the creative_templates table
 The minimal configuration needed to fix the 404 error
*/

-- Start transaction
BEGIN;

-- Create creative_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS creative_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'email', 'banner', 'video', 'social', etc.
  content JSONB NOT NULL,      -- Template content/structure
  metadata JSONB,              -- Additional metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_creative_templates_type ON creative_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_creative_templates_active ON creative_templates(is_active);

-- Check if we already have creative templates data
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM creative_templates;
  
  -- Only proceed with adding sample data if the table is empty
  IF template_count > 0 THEN
    RAISE NOTICE 'Creative templates data already exists (count: %)', template_count;
    RETURN; -- Exit early
  END IF;
  
  -- Insert a few minimal sample templates
  INSERT INTO creative_templates (name, description, template_type, content, metadata, is_active)
  VALUES
  (
    'CardioGuard Plus - Email Template',
    'Basic email template for CardioGuard Plus campaign',
    'email',
    '{
      "subject": "Introducing CardioGuard Plus",
      "body": "Email body content here",
      "footer": "Email footer here"
    }'::jsonb,
    '{
      "campaign": "CardioGuard Plus"
    }'::jsonb,
    TRUE
  ),
  (
    'NeuroBalance - Email Template',
    'Basic email template for NeuroBalance campaign',
    'email',
    '{
      "subject": "Introducing NeuroBalance",
      "body": "Email body content here",
      "footer": "Email footer here"
    }'::jsonb,
    '{
      "campaign": "NeuroBalance"
    }'::jsonb,
    TRUE
  ),
  (
    'Banner Template',
    'Basic banner template',
    'banner',
    '{
      "headline": "Product Headline",
      "subheadline": "Product subheadline",
      "cta_text": "Learn More"
    }'::jsonb,
    '{
      "sizes": ["300x250", "728x90"]
    }'::jsonb,
    TRUE
  );
  
  RAISE NOTICE 'Added sample creative templates';
END $$;

-- Add RLS policies for creative_templates table
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow read access for authenticated users" ON creative_templates;
  
  CREATE POLICY "Allow read access for authenticated users"
    ON creative_templates FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Display summary of templates created
SELECT template_type, COUNT(*) as template_count
FROM creative_templates
GROUP BY template_type
ORDER BY template_count DESC;

COMMIT;
