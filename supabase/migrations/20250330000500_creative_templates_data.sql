-- Create and populate creative_templates table
-- This addresses the 404 error when accessing rest/v1/creative_templates

-- Run in transaction for safety
BEGIN;

-- Helper function to get medication ID by code
CREATE OR REPLACE FUNCTION get_medication_id_by_code(medication_code TEXT)
RETURNS UUID AS $$
DECLARE
  medication_id UUID;
BEGIN
  SELECT id INTO medication_id FROM medications WHERE code = medication_code;
  IF medication_id IS NULL THEN
    -- Fallback to search by name if code not found
    -- This helps with backward compatibility
    SELECT id INTO medication_id FROM medications WHERE name = 
      CASE medication_code
        WHEN 'med-cardioguard-001' THEN 'CardioGuard Plus'
        WHEN 'med-cardioguard-002' THEN 'CardioGuard XR'
        WHEN 'med-competitor-001' THEN 'Cardiomax'
        WHEN 'med-competitor-002' THEN 'HeartShield'
        WHEN 'med-neurobalance-001' THEN 'NeuroBalance'
        WHEN 'med-competitor-003' THEN 'NeuroCare'
        WHEN 'med-competitor-004' THEN 'BrainShield'
        WHEN 'med-immunotherapy-001' THEN 'ImmunoTherapy 5'
        WHEN 'med-competitor-005' THEN 'ImmunoShield'
        WHEN 'med-competitor-006' THEN 'ImmunoMax'
        ELSE medication_code
      END;
  END IF;
  RETURN medication_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get medication name by code
CREATE OR REPLACE FUNCTION get_medication_name_by_code(medication_code TEXT)
RETURNS TEXT AS $$
DECLARE
  medication_name TEXT;
BEGIN
  SELECT name INTO medication_name FROM medications WHERE code = medication_code;
  IF medication_name IS NULL THEN
    -- Fallback mapping
    medication_name := 
      CASE medication_code
        WHEN 'med-cardioguard-001' THEN 'CardioGuard Plus'
        WHEN 'med-cardioguard-002' THEN 'CardioGuard XR'
        WHEN 'med-competitor-001' THEN 'Cardiomax'
        WHEN 'med-competitor-002' THEN 'HeartShield'
        WHEN 'med-neurobalance-001' THEN 'NeuroBalance'
        WHEN 'med-competitor-003' THEN 'NeuroCare'
        WHEN 'med-competitor-004' THEN 'BrainShield'
        WHEN 'med-immunotherapy-001' THEN 'ImmunoTherapy 5'
        WHEN 'med-competitor-005' THEN 'ImmunoShield'
        WHEN 'med-competitor-006' THEN 'ImmunoMax'
        ELSE medication_code
      END;
  END IF;
  RETURN medication_name;
END;
$$ LANGUAGE plpgsql;

-- First, ensure the code column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications' AND column_name = 'code'
  ) THEN
    ALTER TABLE medications ADD COLUMN code TEXT UNIQUE;
  END IF;
END $$;

-- Set up medication variables
DO $$
DECLARE
  cardio_med_id UUID := get_medication_id_by_code('med-cardioguard-001');
  neuro_med_id UUID := get_medication_id_by_code('med-neurobalance-001');
  immuno_med_id UUID := get_medication_id_by_code('med-immunotherapy-001');
BEGIN
  -- Store these values for reference (not actually using stored procedure variables directly in this script)
  RAISE NOTICE 'Using medication IDs: CardioGuard=%, NeuroBalance=%, ImmunoTherapy=%', 
    cardio_med_id, neuro_med_id, immuno_med_id;
END $$;

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
  
  -- Only proceed with generating data if we don't have enough
  IF template_count > 10 THEN
    RAISE NOTICE 'Sufficient creative template data already exists (count: %)', template_count;
    RETURN; -- Exit early
  ELSE
    RAISE NOTICE 'Generating creative template data (current count: %)', template_count;
    -- Delete existing templates if there are just a few to avoid duplicates
    IF template_count > 0 AND template_count < 5 THEN
      DELETE FROM creative_templates;
    END IF;
  END IF;
END $$;

-- Create email templates for each campaign
INSERT INTO creative_templates (name, description, template_type, content, metadata, is_active)
VALUES
-- CardioGuard Plus Templates
(
  'CardioGuard Plus - Cardiology Email',
  'Cardiology-focused email template for CardioGuard Plus campaign',
  'email',
  jsonb_build_object(
    'subject', 'Introducing CardioGuard Plus: Advancing Cardiovascular Care',
    'header', 'CardioGuard Plus: The Next Generation in Cardiovascular Treatment',
    'body', '<p>Dear {{provider_name}},</p>
<p>We're excited to introduce <strong>CardioGuard Plus</strong>, a groundbreaking treatment option for your patients with cardiovascular conditions.</p>
<p>Clinical studies have shown that CardioGuard Plus provides:</p>
<ul>
<li>25% reduction in major adverse cardiac events</li>
<li>Significant improvements in key cardiac markers</li>
<li>Enhanced quality of life metrics for patients</li>
</ul>
<p>Learn more about how CardioGuard Plus can benefit your cardiology practice.</p>',
    'cta_text', 'Download Clinical Data',
    'cta_link', '/resources/cardioguard-clinical-data',
    'footer', '© 2025 PharmaCorp. All rights reserved.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/cardioguard-header.jpg',
        'alt', 'CardioGuard Plus Treatment',
        'position', 'header'
      ),
      jsonb_build_object(
        'url', '/images/cardioguard-graph.jpg',
        'alt', 'Clinical Outcomes Graph',
        'position', 'body'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'Cardiology',
    'campaign', 'CardioGuard Plus Launch',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Cardiology'),
      'prescribing_volume', 'high',
      'regions', jsonb_build_array('Northeast', 'Midwest')
    ),
    'performance_metrics', jsonb_build_object(
      'open_rate', 28.5,
      'click_rate', 12.3,
      'conversion_rate', 4.8
    )
  ),
  TRUE
),
(
  'CardioGuard Plus - Endocrinology Email',
  'Endocrinology-focused email template highlighting cardiovascular benefits for diabetic patients',
  'email',
  jsonb_build_object(
    'subject', 'CardioGuard Plus: Cardiovascular Protection for Diabetic Patients',
    'header', 'Cardiovascular Protection for Your Diabetic Patients',
    'body', '<p>Dear {{provider_name}},</p>
<p>For your patients with diabetes who face increased cardiovascular risks, <strong>CardioGuard Plus</strong> offers significant protective benefits.</p>
<p>Recent studies in diabetic populations have demonstrated:</p>
<ul>
<li>32% reduction in cardiovascular events in diabetic patients</li>
<li>Improved glycemic control markers</li>
<li>Beneficial effects on diabetic cardiomyopathy</li>
</ul>
<p>Discover how CardioGuard Plus can complement your treatment plans for diabetic patients.</p>',
    'cta_text', 'View Diabetic Subgroup Analysis',
    'cta_link', '/resources/cardioguard-diabetes-analysis',
    'footer', '© 2025 PharmaCorp. All rights reserved.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/cardioguard-diabetes.jpg',
        'alt', 'CardioGuard Plus for Diabetic Patients',
        'position', 'header'
      ),
      jsonb_build_object(
        'url', '/images/diabetes-cv-outcomes.jpg',
        'alt', 'Cardiovascular Outcomes in Diabetic Patients',
        'position', 'body'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'Endocrinology',
    'campaign', 'CardioGuard Plus Launch',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Endocrinology'),
      'prescribing_volume', 'medium',
      'regions', jsonb_build_array('Northeast', 'Midwest', 'Nationwide')
    ),
    'performance_metrics', jsonb_build_object(
      'open_rate', 22.7,
      'click_rate', 9.8,
      'conversion_rate', 3.5
    )
  ),
  TRUE
),

-- NeuroBalance Templates
(
  'NeuroBalance - Psychiatry Email',
  'Psychiatry-focused email template for NeuroBalance campaign',
  'email',
  jsonb_build_object(
    'subject', 'NeuroBalance: Advanced Treatment for Psychiatric Disorders',
    'header', 'NeuroBalance: Redefining Treatment Standards in Psychiatry',
    'body', '<p>Dear {{provider_name}},</p>
<p><strong>NeuroBalance</strong> represents a significant advancement in the treatment of multiple psychiatric conditions, offering improved efficacy with a favorable side effect profile.</p>
<p>Key benefits for psychiatric patients include:</p>
<ul>
<li>Rapid onset of action (average 4-7 days)</li>
<li>65% reduction in treatment-resistant cases</li>
<li>Minimal cognitive side effects compared to standard treatments</li>
</ul>
<p>Explore how NeuroBalance can enhance outcomes for your psychiatric practice.</p>',
    'cta_text', 'Access Full Prescribing Information',
    'cta_link', '/resources/neurobalance-prescribing-info',
    'footer', '© 2025 PsychMed Pharmaceuticals. All rights reserved.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/neurobalance-header.jpg',
        'alt', 'NeuroBalance Treatment',
        'position', 'header'
      ),
      jsonb_build_object(
        'url', '/images/psychiatric-outcomes.jpg',
        'alt', 'Psychiatric Treatment Outcomes',
        'position', 'body'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'Psychiatry',
    'campaign', 'NeuroBalance Multi-Specialty Initiative',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Psychiatry'),
      'prescribing_volume', 'high',
      'regions', jsonb_build_array('West', 'Southwest')
    ),
    'performance_metrics', jsonb_build_object(
      'open_rate', 31.2,
      'click_rate', 14.5,
      'conversion_rate', 5.3
    )
  ),
  TRUE
),
(
  'NeuroBalance - Neurology Email',
  'Neurology-focused email template for NeuroBalance campaign',
  'email',
  jsonb_build_object(
    'subject', 'NeuroBalance: Novel Approach for Neurological Applications',
    'header', 'NeuroBalance in Neurology: Evidence-Based Applications',
    'body', '<p>Dear {{provider_name}},</p>
<p>We're pleased to share emerging data on <strong>NeuroBalance</strong> and its applications in neurological conditions.</p>
<p>Recent clinical studies have demonstrated efficacy in:</p>
<ul>
<li>Neuropathic pain management with 43% improvement in pain scores</li>
<li>Certain movement disorders with significant symptom reduction</li>
<li>Neurological manifestations of autoimmune conditions</li>
</ul>
<p>Learn how NeuroBalance can complement your treatment approach for complex neurological cases.</p>',
    'cta_text', 'Review Neurological Case Studies',
    'cta_link', '/resources/neurobalance-neurology-cases',
    'footer', '© 2025 PsychMed Pharmaceuticals. All rights reserved.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/neurobalance-neurology.jpg',
        'alt', 'NeuroBalance for Neurological Conditions',
        'position', 'header'
      ),
      jsonb_build_object(
        'url', '/images/neurology-outcomes.jpg',
        'alt', 'Neurological Treatment Outcomes',
        'position', 'body'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'Neurology',
    'campaign', 'NeuroBalance Multi-Specialty Initiative',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Neurology'),
      'prescribing_volume', 'medium',
      'regions', jsonb_build_array('West', 'Southwest', 'Northwest')
    ),
    'performance_metrics', jsonb_build_object(
      'open_rate', 25.8,
      'click_rate', 11.2,
      'conversion_rate', 4.1
    )
  ),
  TRUE
),

-- ImmunoTherapy Templates
(
  'ImmunoTherapy 5 - Oncology Email',
  'Oncology-focused email template for ImmunoTherapy campaign',
  'email',
  jsonb_build_object(
    'subject', 'ImmunoTherapy 5: Advances in Cancer Immunotherapy',
    'header', 'ImmunoTherapy 5: Next-Generation Cancer Immunotherapy',
    'body', '<p>Dear {{provider_name}},</p>
<p><strong>ImmunoTherapy 5</strong> represents the latest advancement in cancer immunotherapy, with expanded indications and improved response rates.</p>
<p>Key oncology benefits include:</p>
<ul>
<li>38% improvement in overall response rate across multiple tumor types</li>
<li>Extended progression-free survival in previously refractory patients</li>
<li>Favorable safety profile even in combination therapies</li>
</ul>
<p>Explore the potential of ImmunoTherapy 5 for your oncology patients.</p>',
    'cta_text', 'Download Clinical Trial Results',
    'cta_link', '/resources/immunotherapy5-clinical-trials',
    'footer', '© 2025 ImmunoGen Therapeutics. All rights reserved.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/immunotherapy5-header.jpg',
        'alt', 'ImmunoTherapy 5 Treatment',
        'position', 'header'
      ),
      jsonb_build_object(
        'url', '/images/oncology-survival-curves.jpg',
        'alt', 'Survival Curve Comparison',
        'position', 'body'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'Oncology',
    'campaign', 'ImmunoTherapy Access Program',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Oncology'),
      'prescribing_volume', 'high',
      'regions', jsonb_build_array('Nationwide')
    ),
    'performance_metrics', jsonb_build_object(
      'open_rate', 34.7,
      'click_rate', 16.9,
      'conversion_rate', 6.2
    )
  ),
  TRUE
),
(
  'ImmunoTherapy 5 - Rheumatology Email',
  'Rheumatology-focused email template for ImmunoTherapy campaign',
  'email',
  jsonb_build_object(
    'subject', 'ImmunoTherapy 5: New Applications in Rheumatologic Conditions',
    'header', 'ImmunoTherapy 5 for Refractory Autoimmune Conditions',
    'body', '<p>Dear {{provider_name}},</p>
<p>We're pleased to share new data on <strong>ImmunoTherapy 5</strong> in the treatment of severe, refractory autoimmune conditions.</p>
<p>Recent studies in rheumatologic applications demonstrate:</p>
<ul>
<li>72% clinical response in treatment-refractory cases</li>
<li>Significant improvements in joint preservation metrics</li>
<li>Durable remissions lasting an average of 14 months</li>
</ul>
<p>Consider ImmunoTherapy 5 for your patients who have failed conventional treatments.</p>',
    'cta_text', 'Review Rheumatology Case Series',
    'cta_link', '/resources/immunotherapy5-rheumatology-cases',
    'footer', '© 2025 ImmunoGen Therapeutics. All rights reserved.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/immunotherapy5-rheumatology.jpg',
        'alt', 'ImmunoTherapy 5 for Autoimmune Conditions',
        'position', 'header'
      ),
      jsonb_build_object(
        'url', '/images/rheumatology-response-data.jpg',
        'alt', 'Clinical Response in Autoimmune Conditions',
        'position', 'body'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'Rheumatology',
    'campaign', 'ImmunoTherapy Access Program',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Rheumatology'),
      'prescribing_volume', 'medium',
      'regions', jsonb_build_array('Nationwide', 'Northeast', 'Southeast')
    ),
    'performance_metrics', jsonb_build_object(
      'open_rate', 29.3,
      'click_rate', 13.1,
      'conversion_rate', 4.5
    )
  ),
  TRUE
);

-- Create digital banner ad templates
INSERT INTO creative_templates (name, description, template_type, content, metadata, is_active)
VALUES
(
  'CardioGuard Plus - Banner Ad Set',
  'Digital banner ads for CardioGuard Plus campaign in multiple sizes',
  'banner',
  jsonb_build_object(
    'headline', 'CardioGuard Plus: Redefining Cardiovascular Care',
    'subheadline', 'Proven 25% reduction in adverse events',
    'body', 'Learn how your patients can benefit',
    'cta_text', 'See The Data',
    'cta_link', '/cardioguard-plus-data',
    'background_color', '#0A5378',
    'text_color', '#FFFFFF',
    'accent_color', '#E3F2FD',
    'sizes', jsonb_build_array(
      '300x250', '728x90', '120x600', '160x600', '300x600', '970x250'
    ),
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/cardioguard-banner-bg.jpg',
        'alt', 'CardioGuard Plus Treatment',
        'size', '300x250'
      ),
      jsonb_build_object(
        'url', '/images/cardioguard-banner-wide.jpg',
        'alt', 'CardioGuard Plus Treatment',
        'size', '728x90'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'All',
    'campaign', 'CardioGuard Plus Launch',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Cardiology', 'Endocrinology', 'Primary Care'),
      'prescribing_volume', 'all',
      'regions', jsonb_build_array('Northeast', 'Midwest')
    ),
    'performance_metrics', jsonb_build_object(
      'impression_rate', 840000,
      'click_rate', 1.8,
      'conversion_rate', 0.5
    )
  ),
  TRUE
),
(
  'NeuroBalance - Banner Ad Set',
  'Digital banner ads for NeuroBalance campaign in multiple sizes',
  'banner',
  jsonb_build_object(
    'headline', 'NeuroBalance: Advanced Neuropsychiatric Care',
    'subheadline', 'Rapid onset. Minimal side effects.',
    'body', 'A new option for your patients',
    'cta_text', 'Learn More',
    'cta_link', '/neurobalance-resources',
    'background_color', '#4A148C',
    'text_color', '#FFFFFF',
    'accent_color', '#CE93D8',
    'sizes', jsonb_build_array(
      '300x250', '728x90', '120x600', '160x600', '300x600', '970x250'
    ),
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/neurobalance-banner-bg.jpg',
        'alt', 'NeuroBalance Treatment',
        'size', '300x250'
      ),
      jsonb_build_object(
        'url', '/images/neurobalance-banner-wide.jpg',
        'alt', 'NeuroBalance Treatment',
        'size', '728x90'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'All',
    'campaign', 'NeuroBalance Multi-Specialty Initiative',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Psychiatry', 'Neurology', 'Primary Care', 'Geriatric Medicine'),
      'prescribing_volume', 'all',
      'regions', jsonb_build_array('West', 'Southwest')
    ),
    'performance_metrics', jsonb_build_object(
      'impression_rate', 760000,
      'click_rate', 2.1,
      'conversion_rate', 0.6
    )
  ),
  TRUE
),
(
  'ImmunoTherapy 5 - Banner Ad Set',
  'Digital banner ads for ImmunoTherapy 5 campaign in multiple sizes',
  'banner',
  jsonb_build_object(
    'headline', 'ImmunoTherapy 5: Expanding Treatment Horizons',
    'subheadline', 'Now approved for multiple indications',
    'body', 'See the latest data',
    'cta_text', 'Discover More',
    'cta_link', '/immunotherapy5-indications',
    'background_color', '#004D40',
    'text_color', '#FFFFFF',
    'accent_color', '#A7FFEB',
    'sizes', jsonb_build_array(
      '300x250', '728x90', '120x600', '160x600', '300x600', '970x250'
    ),
    'images', jsonb_build_array(
      jsonb_build_object(
        'url', '/images/immunotherapy5-banner-bg.jpg',
        'alt', 'ImmunoTherapy 5 Treatment',
        'size', '300x250'
      ),
      jsonb_build_object(
        'url', '/images/immunotherapy5-banner-wide.jpg',
        'alt', 'ImmunoTherapy 5 Treatment',
        'size', '728x90'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'All',
    'campaign', 'ImmunoTherapy Access Program',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Oncology', 'Rheumatology', 'Gastroenterology', 'Dermatology'),
      'prescribing_volume', 'all',
      'regions', jsonb_build_array('Nationwide')
    ),
    'performance_metrics', jsonb_build_object(
      'impression_rate', 920000,
      'click_rate', 2.3,
      'conversion_rate', 0.7
    )
  ),
  TRUE
);

-- Create video templates
INSERT INTO creative_templates (name, description, template_type, content, metadata, is_active)
VALUES
(
  'CardioGuard Plus - Video Overview',
  'Video overview of CardioGuard Plus for healthcare professionals',
  'video',
  jsonb_build_object(
    'title', 'CardioGuard Plus: Mechanism of Action and Clinical Outcomes',
    'duration', '3:45',
    'transcript', 'This comprehensive overview explores the unique mechanism of action of CardioGuard Plus and its impact on cardiovascular outcomes. The video details key clinical trial results, showing a 25% reduction in major adverse cardiac events compared to standard of care...',
    'thumbnail_url', '/images/cardioguard-video-thumbnail.jpg',
    'video_url', '/videos/cardioguard-moa-clinical.mp4',
    'captions_url', '/videos/cardioguard-moa-clinical-captions.vtt',
    'chapters', jsonb_build_array(
      jsonb_build_object(
        'title', 'Introduction',
        'timestamp', '00:00'
      ),
      jsonb_build_object(
        'title', 'Mechanism of Action',
        'timestamp', '00:45'
      ),
      jsonb_build_object(
        'title', 'Clinical Trial Results',
        'timestamp', '01:30'
      ),
      jsonb_build_object(
        'title', 'Patient Selection',
        'timestamp', '02:15'
      ),
      jsonb_build_object(
        'title', 'Summary',
        'timestamp', '03:00'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'All',
    'campaign', 'CardioGuard Plus Launch',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Cardiology', 'Endocrinology', 'Primary Care'),
      'prescribing_volume', 'all',
      'regions', jsonb_build_array('Nationwide')
    ),
    'performance_metrics', jsonb_build_object(
      'view_count', 15800,
      'average_watch_time', 165,
      'completion_rate', 72.5,
      'conversion_rate', 3.2
    )
  ),
  TRUE
),
(
  'NeuroBalance - Clinical Insights Video',
  'Expert clinical insights video for NeuroBalance',
  'video',
  jsonb_build_object(
    'title', 'NeuroBalance: Clinical Insights from Leading Experts',
    'duration', '4:30',
    'transcript', 'In this roundtable discussion, leading psychiatrists and neurologists share their clinical experiences with NeuroBalance. Topics include patient selection criteria, dosing strategies, managing side effects, and combination therapy approaches...',
    'thumbnail_url', '/images/neurobalance-video-thumbnail.jpg',
    'video_url', '/videos/neurobalance-clinical-insights.mp4',
    'captions_url', '/videos/neurobalance-clinical-insights-captions.vtt',
    'chapters', jsonb_build_array(
      jsonb_build_object(
        'title', 'Introduction',
        'timestamp', '00:00'
      ),
      jsonb_build_object(
        'title', 'Patient Selection',
        'timestamp', '00:45'
      ),
      jsonb_build_object(
        'title', 'Dosing Strategies',
        'timestamp', '01:45'
      ),
      jsonb_build_object(
        'title', 'Side Effect Management',
        'timestamp', '02:30'
      ),
      jsonb_build_object(
        'title', 'Combination Approaches',
        'timestamp', '03:15'
      ),
      jsonb_build_object(
        'title', 'Conclusion',
        'timestamp', '04:00'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'All',
    'campaign', 'NeuroBalance Multi-Specialty Initiative',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Psychiatry', 'Neurology', 'Primary Care', 'Geriatric Medicine'),
      'prescribing_volume', 'all',
      'regions', jsonb_build_array('Nationwide')
    ),
    'performance_metrics', jsonb_build_object(
      'view_count', 12600,
      'average_watch_time', 195,
      'completion_rate', 68.3,
      'conversion_rate', 2.9
    )
  ),
  TRUE
),
(
  'ImmunoTherapy 5 - Case Study Video Series',
  'Clinical case study video series for ImmunoTherapy 5',
  'video',
  jsonb_build_object(
    'title', 'ImmunoTherapy 5: Clinical Case Series Across Specialties',
    'duration', '5:15',
    'transcript', 'This video presents a series of clinical cases demonstrating the application of ImmunoTherapy 5 across multiple specialties. Oncologists, rheumatologists, and gastroenterologists share their experiences with challenging cases and treatment outcomes...',
    'thumbnail_url', '/images/immunotherapy5-video-thumbnail.jpg',
    'video_url', '/videos/immunotherapy5-case-studies.mp4',
    'captions_url', '/videos/immunotherapy5-case-studies-captions.vtt',
    'chapters', jsonb_build_array(
      jsonb_build_object(
        'title', 'Introduction',
        'timestamp', '00:00'
      ),
      jsonb_build_object(
        'title', 'Oncology Case',
        'timestamp', '00:30'
      ),
      jsonb_build_object(
        'title', 'Rheumatology Case',
        'timestamp', '01:45'
      ),
      jsonb_build_object(
        'title', 'Gastroenterology Case',
        'timestamp', '03:00'
      ),
      jsonb_build_object(
        'title', 'Treatment Principles',
        'timestamp', '04:15'
      ),
      jsonb_build_object(
        'title', 'Conclusion',
        'timestamp', '05:00'
      )
    )
  ),
  jsonb_build_object(
    'specialty', 'All',
    'campaign', 'ImmunoTherapy Access Program',
    'target_audience', jsonb_build_object(
      'specialties', jsonb_build_array('Oncology', 'Rheumatology', 'Gastroenterology', 'Dermatology'),
      'prescribing_volume', 'all',
      'regions', jsonb_build_array('Nationwide')
    ),
    'performance_metrics', jsonb_build_object(
      'view_count', 18400,
      'average_watch_time', 210,
      'completion_rate', 65.7,
      'conversion_rate', 3.5
    )
  ),
  TRUE
);

-- Add RLS policies for creative_templates table
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users"
  ON creative_templates FOR SELECT
  TO authenticated
  USING (true);

-- Display summary of templates created
SELECT template_type, COUNT(*) as template_count
FROM creative_templates
GROUP BY template_type
ORDER BY template_count DESC;

COMMIT;
