-- Create creative templates table
CREATE TABLE IF NOT EXISTS creative_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,  -- e.g. 'email', 'banner', 'video', etc.
  category VARCHAR(100),      -- e.g. 'awareness', 'education', 'conversion'
  content JSONB,              -- Stores the template content structure
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,              -- Additional template metadata
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add sample data
INSERT INTO creative_templates (name, description, type, category, content, is_active, metadata)
VALUES
  ('Email Newsletter Template',
   'Standard email template for medication announcements',
   'email',
   'awareness',
   '{
      "subject": "Important update about {{medication_name}}",
      "header": "New information about {{medication_name}}",
      "body": "Dear {{provider_name}},\n\nWe would like to inform you about important updates regarding {{medication_name}}. {{custom_message}}\n\nBest regards,\nThe {{company_name}} Team",
      "footer": "© {{current_year}} {{company_name}}. All rights reserved."
    }',
    true,
    '{"difficulty": "beginner", "average_open_rate": 32}'
  ),

  ('Banner Ad Template',
   'Digital banner for medication promotions',
   'banner',
   'conversion',
   '{
      "headline": "Learn about {{medication_name}}",
      "subheading": "{{tagline}}",
      "cta_text": "Learn More",
      "background_color": "#f5f9ff",
      "text_color": "#2a4b8d"
    }',
    true,
    '{"sizes": ["300x250", "728x90", "160x600"], "avg_ctr": 2.4}'
  ),

  ('Educational PDF Template',
   'PDF handout with medication information for providers',
   'document',
   'education',
   '{
      "title": "{{medication_name}} Clinical Overview",
      "sections": [
        {"heading": "Indications", "content_placeholder": "{{indications_content}}"},
        {"heading": "Dosage", "content_placeholder": "{{dosage_content}}"},
        {"heading": "Side Effects", "content_placeholder": "{{side_effects_content}}"},
        {"heading": "Clinical Studies", "content_placeholder": "{{studies_content}}"}
      ],
      "footer_text": "For medical professionals only. {{legal_disclaimer}}"
    }',
    true,
    '{"pages": 2, "format": "PDF"}'
  ),

  ('Provider Video Template',
   'Video template for medication educational content',
   'video',
   'education',
   '{
      "intro_text": "Introduction to {{medication_name}}",
      "sections": [
        {"title": "Mechanism of Action", "duration": 45},
        {"title": "Clinical Efficacy", "duration": 90},
        {"title": "Patient Selection", "duration": 60},
        {"title": "Safety Profile", "duration": 75}
      ],
      "outro_text": "Thank you for watching"
    }',
    true,
    '{"duration": "4:30", "format": "MP4", "resolution": "1080p"}'
  ),

  ('Social Media Post Template',
   'Template for social media posts about medications',
   'social',
   'awareness',
   '{
      "headline": "{{medication_name}} - Now Available",
      "body_text": "{{custom_message}}",
      "hashtags": ["#Healthcare", "#MedicalInnovation"],
      "cta": "Learn more at {{website_url}}"
    }',
    true,
    '{"platforms": ["LinkedIn", "Twitter"], "optimal_time": "Tuesday 10AM"}'
  );

-- Add index for faster lookups
CREATE INDEX idx_creative_templates_type ON creative_templates(type);
CREATE INDEX idx_creative_templates_category ON creative_templates(category);

-- Create a view for active templates only
CREATE OR REPLACE VIEW active_creative_templates AS
SELECT * FROM creative_templates WHERE is_active = true;

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_creative_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creative_templates_timestamp
BEFORE UPDATE ON creative_templates
FOR EACH ROW
EXECUTE FUNCTION update_creative_templates_updated_at();

-- Add RLS policies
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates" ON creative_templates
FOR SELECT USING (is_active = true);

-- Only authenticated users can insert templates
CREATE POLICY "Authenticated users can insert templates" ON creative_templates
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only the creator or admin can update/delete templates
CREATE POLICY "Creators can update their templates" ON creative_templates
FOR UPDATE USING (auth.uid() = creator_id OR auth.role() = 'service_role');

CREATE POLICY "Creators can delete their templates" ON creative_templates
FOR DELETE USING (auth.uid() = creator_id OR auth.role() = 'service_role');
