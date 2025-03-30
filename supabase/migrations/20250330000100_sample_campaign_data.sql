-- Create sample campaign data for testing and demos
-- This migration adds three diverse campaigns with different targeting criteria

-- Run in transaction for safety
BEGIN;

-- Helper function to get a random user ID (for created_by field)
-- Will use in case we need to assign campaigns to existing users
CREATE OR REPLACE FUNCTION get_random_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  -- If no users exist, return a placeholder UUID
  IF user_id IS NULL THEN
    user_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Check if code column exists in medications table; if not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications' AND column_name = 'code'
  ) THEN
    ALTER TABLE medications ADD COLUMN code TEXT UNIQUE;
  END IF;
END $$;

-- Create medication reference data with proper UUIDs and insert campaigns in the same transaction block
DO $$
DECLARE
  cardio_med1_id UUID;
  cardio_med2_id UUID;
  cardio_comp1_id UUID;
  cardio_comp2_id UUID;
  neuro_med1_id UUID;
  neuro_comp1_id UUID;
  neuro_comp2_id UUID;
  immuno_med1_id UUID;
  immuno_comp1_id UUID;
  immuno_comp2_id UUID;
  random_user_id UUID;
BEGIN
  -- Get a random user ID for the created_by field
  SELECT get_random_user_id() INTO random_user_id;

  -- Check if medications table is empty
  IF NOT EXISTS (SELECT 1 FROM medications LIMIT 1) THEN
    -- Insert medications and capture their UUIDs
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-cardioguard-001', 'CardioGuard Plus', 'Cardiovascular', 'Next-generation cardiovascular medication')
    RETURNING id INTO cardio_med1_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-cardioguard-002', 'CardioGuard XR', 'Cardiovascular', 'Extended release cardiovascular medication')
    RETURNING id INTO cardio_med2_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-competitor-001', 'Cardiomax', 'Cardiovascular', 'Competitor cardiovascular medication')
    RETURNING id INTO cardio_comp1_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-competitor-002', 'HeartShield', 'Cardiovascular', 'Competitor cardiovascular medication')
    RETURNING id INTO cardio_comp2_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-neurobalance-001', 'NeuroBalance', 'Neurology', 'Advanced neurological treatment')
    RETURNING id INTO neuro_med1_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-competitor-003', 'NeuroCare', 'Neurology', 'Competitor neurological medication')
    RETURNING id INTO neuro_comp1_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-competitor-004', 'BrainShield', 'Neurology', 'Competitor neurological medication')
    RETURNING id INTO neuro_comp2_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-immunotherapy-001', 'ImmunoTherapy 5', 'Immunology', 'Revolutionary immunotherapy treatment')
    RETURNING id INTO immuno_med1_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-competitor-005', 'ImmunoShield', 'Immunology', 'Competitor immunotherapy medication')
    RETURNING id INTO immuno_comp1_id;
    
    INSERT INTO medications (code, name, category, description)
    VALUES ('med-competitor-006', 'ImmunoMax', 'Immunology', 'Competitor immunotherapy medication')
    RETURNING id INTO immuno_comp2_id;
  ELSE
    -- If medications already exist, get their IDs
    SELECT id INTO cardio_med1_id FROM medications WHERE code = 'med-cardioguard-001';
    SELECT id INTO cardio_med2_id FROM medications WHERE code = 'med-cardioguard-002';
    SELECT id INTO cardio_comp1_id FROM medications WHERE code = 'med-competitor-001';
    SELECT id INTO cardio_comp2_id FROM medications WHERE code = 'med-competitor-002';
    SELECT id INTO neuro_med1_id FROM medications WHERE code = 'med-neurobalance-001';
    SELECT id INTO neuro_comp1_id FROM medications WHERE code = 'med-competitor-003';
    SELECT id INTO neuro_comp2_id FROM medications WHERE code = 'med-competitor-004';
    SELECT id INTO immuno_med1_id FROM medications WHERE code = 'med-immunotherapy-001';
    SELECT id INTO immuno_comp1_id FROM medications WHERE code = 'med-competitor-005';
    SELECT id INTO immuno_comp2_id FROM medications WHERE code = 'med-competitor-006';
  END IF;

  -- Delete existing sample campaigns if they exist (for idempotency)
  DELETE FROM campaigns WHERE name IN (
    'CardioGuard Plus Launch',
    'NeuroBalance Multi-Specialty Initiative',
    'ImmunoTherapy Access Program'
  );

  -- Generate Campaign 1: CardioGuard Plus Launch
  INSERT INTO campaigns (
    id,
    name,
    target_medication_id,
    target_specialty,
    target_geographic_area,
    status,
    targeting_logic,
    targeting_metadata,
    start_date,
    end_date,
    created_by,
    created_at
  )
  VALUES (
    gen_random_uuid(), -- Generate a random UUID for campaign
    'CardioGuard Plus Launch',
    cardio_med1_id, -- Target medication (now a proper UUID)
    'Cardiology', -- Primary specialty
    'Northeast', -- Primary region
    'completed', -- Campaign is completed
    'and',
    json_build_object(
      'medicationCategory', 'Cardiovascular',
      'excluded_medications', ARRAY[cardio_comp1_id::text, cardio_comp2_id::text],
      'prescribing_volume', 'all',
      'timeframe', 'last_quarter',
      'multi_specialty', json_build_object(
        'specialties', ARRAY['Cardiology', 'Endocrinology', 'Primary Care'],
        'primary_focus', 'Cardiology'
      ),
      'multi_region', ARRAY['Northeast', 'Midwest'],
      'campaign_phases', json_build_array(
        json_build_object(
          'phase', 'Initial Adoption',
          'duration_days', 14,
          'target_lift', 8
        ),
        json_build_object(
          'phase', 'Acceleration',
          'duration_days', 14,
          'target_lift', 18
        ),
        json_build_object(
          'phase', 'Maturation',
          'duration_days', 30,
          'target_lift', 25
        ),
        json_build_object(
          'phase', 'Maintenance',
          'duration_days', 30,
          'target_lift', 28
        )
      )
    ),
  (CURRENT_DATE - INTERVAL '90 days')::date, -- Started 90 days ago
  (CURRENT_DATE - INTERVAL '10 days')::date, -- Ended 10 days ago
  get_random_user_id(),
  (CURRENT_DATE - INTERVAL '100 days')::timestamp with time zone -- Created 100 days ago
);

  -- Generate Campaign 2: NeuroBalance Multi-Specialty Initiative
  INSERT INTO campaigns (
    id,
    name,
    target_medication_id,
    target_specialty,
    target_geographic_area,
    status,
    targeting_logic,
    targeting_metadata,
    start_date,
    end_date,
    created_by,
    created_at
  )
  VALUES (
    gen_random_uuid(), -- Generate a random UUID for campaign
    'NeuroBalance Multi-Specialty Initiative',
    neuro_med1_id, -- Target medication (now a proper UUID)
    'Psychiatry', -- Primary specialty
    'West', -- Primary region
    'active', -- Campaign is active
    'and',
    json_build_object(
      'medicationCategory', 'Neurology',
      'excluded_medications', ARRAY[neuro_comp1_id::text],
      'prescribing_volume', 'high',
      'timeframe', 'last_month',
      'multi_specialty', json_build_object(
        'specialties', ARRAY['Psychiatry', 'Neurology', 'Primary Care', 'Geriatric Medicine'],
        'primary_focus', 'Psychiatry',
        'specialty_phases', json_build_object(
          'Psychiatry', 1,
          'Neurology', 2,
          'Primary Care', 3,
          'Geriatric Medicine', 2
        )
      ),
      'multi_region', ARRAY['West', 'Southwest'],
      'campaign_phases', json_build_array(
        json_build_object(
          'phase', 'Psychiatry Focus',
          'duration_days', 21,
          'target_lift', 20
        ),
        json_build_object(
          'phase', 'Neurology Expansion',
          'duration_days', 14,
          'target_lift', 15
        ),
        json_build_object(
          'phase', 'Primary Care Integration',
          'duration_days', 25,
          'target_lift', 10
        )
      )
    ),
  (CURRENT_DATE - INTERVAL '45 days')::date, -- Started 45 days ago
  (CURRENT_DATE + INTERVAL '15 days')::date, -- Ends 15 days from now
  get_random_user_id(),
  (CURRENT_DATE - INTERVAL '60 days')::timestamp with time zone -- Created 60 days ago
);

  -- Generate Campaign 3: ImmunoTherapy Access Program
  INSERT INTO campaigns (
    id,
    name,
    target_medication_id,
    target_specialty,
    target_geographic_area,
    status,
    targeting_logic,
    targeting_metadata,
    start_date,
    end_date,
    created_by,
    created_at
  )
  VALUES (
    gen_random_uuid(), -- Generate a random UUID for campaign
    'ImmunoTherapy Access Program',
    immuno_med1_id, -- Target medication (now a proper UUID)
    'Oncology', -- Primary specialty
    'Nationwide', -- Primary region
    'completed', -- Campaign is completed
    'and',
    json_build_object(
      'medicationCategory', 'Immunology',
      'excluded_medications', ARRAY[immuno_comp1_id::text, immuno_comp2_id::text],
      'prescribing_volume', 'medium',
      'timeframe', 'last_quarter',
      'multi_specialty', json_build_object(
        'specialties', ARRAY['Oncology', 'Rheumatology', 'Gastroenterology', 'Dermatology'],
        'primary_focus', 'Oncology',
        'specialty_adoption_rates', json_build_object(
          'Oncology', 0.18,
          'Rheumatology', 0.14,
          'Gastroenterology', 0.09,
          'Dermatology', 0.06
        )
      ),
      'campaign_phases', json_build_array(
        json_build_object(
          'phase', 'Education',
          'duration_days', 7,
          'target_lift', 3
        ),
        json_build_object(
          'phase', 'Early Adoption',
          'duration_days', 14,
          'target_lift', 9
        ),
        json_build_object(
          'phase', 'Peer-to-Peer',
          'duration_days', 7,
          'target_lift', 14
        ),
        json_build_object(
          'phase', 'Sustained Growth',
          'duration_days', 14,
          'target_lift', 17
        )
      )
    ),
  (CURRENT_DATE - INTERVAL '60 days')::date, -- Started 60 days ago
  (CURRENT_DATE - INTERVAL '18 days')::date, -- Ended 18 days ago
  get_random_user_id(),
  (CURRENT_DATE - INTERVAL '70 days')::timestamp with time zone -- Created 70 days ago
);

END $$;

-- Clean up our temporary function
DROP FUNCTION IF EXISTS get_random_user_id();

-- Return campaign IDs for verification
SELECT id, name FROM campaigns 
WHERE name IN (
  'CardioGuard Plus Launch',
  'NeuroBalance Multi-Specialty Initiative',
  'ImmunoTherapy Access Program'
);

COMMIT;
