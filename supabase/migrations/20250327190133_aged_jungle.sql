/*
  # Add RLS policies for reference tables

  1. Security
    - Enable RLS on all reference tables
    - Add policies for authenticated users to read data
*/

-- Enable RLS on tables
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;

-- Add policies for authenticated users to read data
CREATE POLICY "Allow authenticated read access for conditions"
  ON conditions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access for medications"
  ON medications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access for specialties"
  ON specialties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access for geographic_regions"
  ON geographic_regions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access for creative_templates"
  ON creative_templates
  FOR SELECT
  TO authenticated
  USING (true);