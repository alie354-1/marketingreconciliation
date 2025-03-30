-- Create creative_templates table
CREATE TABLE IF NOT EXISTS creative_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  headline_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  cta_template TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{"required": []}',
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add some sample templates
INSERT INTO creative_templates (name, headline_template, body_template, cta_template, variables, category)
VALUES
  (
    'Generic Medication Promotion',
    'Discover the benefits of {{medication_name}}',
    'Help your patients manage {{condition}} with {{medication_name}}. Clinical studies show improved outcomes in {{percentage}}% of cases.',
    'Learn More About {{medication_name}}',
    '{"required": ["medication_name", "condition", "percentage"]}',
    'medication'
  ),
  (
    'Specialty Focus',
    'Attention {{specialty}} Providers',
    'New research shows {{medication_name}} is effective for {{condition}} patients. {{benefit_description}}',
    'Request Information',
    '{"required": ["specialty", "medication_name", "condition", "benefit_description"]}',
    'specialty'
  ),
  (
    'Patient Adherence',
    'Improve Patient Adherence for {{condition}}',
    '{{medication_name}} offers {{benefit}} that can help your patients stay on treatment. {{adherence_stat}}',
    'Explore Patient Resources',
    '{"required": ["condition", "medication_name", "benefit", "adherence_stat"]}',
    'adherence'
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_creative_templates_updated_at
BEFORE UPDATE ON creative_templates
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add RLS policies
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view creative templates
CREATE POLICY creative_templates_view_policy
  ON creative_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow only specific users to modify creative templates (can be adjusted)
CREATE POLICY creative_templates_insert_policy
  ON creative_templates
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY creative_templates_update_policy
  ON creative_templates
  FOR UPDATE
  USING (auth.role() = 'authenticated');
