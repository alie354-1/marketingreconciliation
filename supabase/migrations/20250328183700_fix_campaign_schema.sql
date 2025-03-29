/*
  # Fix Campaign Schema Constraints
  
  1. Removing creative_content requirement
    - Drop the creative_content column entirely
    
  2. Making targeting fields optional
    - Remove NOT NULL constraints from target_geographic_area and target_specialty
    - This allows more flexible targeting options
    
  3. Add metadata column
    - Add targeting_metadata to store additional targeting information
    - Will be used for excluded medications and other targeting criteria
*/

-- Remove creative_content requirement (drop column entirely)
ALTER TABLE campaigns DROP COLUMN IF EXISTS creative_content;

-- Make geographic area optional to match targeting workflow
ALTER TABLE campaigns ALTER COLUMN target_geographic_area DROP NOT NULL;

-- Make target specialty optional to match targeting workflow
ALTER TABLE campaigns ALTER COLUMN target_specialty DROP NOT NULL;

-- Add targeting_metadata column to store additional targeting information
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS targeting_metadata jsonb;

-- Add comment explaining the changes
COMMENT ON TABLE campaigns IS 'Marketing campaign data with flexible targeting options';
