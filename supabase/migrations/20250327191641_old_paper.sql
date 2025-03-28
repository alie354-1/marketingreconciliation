/*
  # Create database tables and policies

  1. New Tables
    - conditions (medical conditions)
    - medications (pharmaceutical products)
    - specialties (medical specialties)
    - geographic_regions (target areas)
    - creative_templates (campaign templates)
    - campaigns (marketing campaigns)
    - campaign_results (performance metrics)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tables if they don't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS medications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS specialties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS geographic_regions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    population integer,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS creative_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    template_type text NOT NULL,
    headline_template text NOT NULL,
    body_template text NOT NULL,
    cta_template text NOT NULL,
    variables jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    target_condition_id uuid REFERENCES conditions(id),
    target_medication_id uuid REFERENCES medications(id),
    target_geographic_area text NOT NULL,
    target_specialty text NOT NULL,
    creative_content jsonb NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    start_date timestamptz,
    end_date timestamptz,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS campaign_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid REFERENCES campaigns(id),
    metrics jsonb NOT NULL,
    report_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS on tables that don't have it enabled
DO $$ BEGIN
  ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE geographic_regions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE campaign_results ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create policies if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conditions' 
    AND policyname = 'Allow authenticated read access for conditions'
  ) THEN
    CREATE POLICY "Allow authenticated read access for conditions"
      ON conditions FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications' 
    AND policyname = 'Allow authenticated read access for medications'
  ) THEN
    CREATE POLICY "Allow authenticated read access for medications"
      ON medications FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'specialties' 
    AND policyname = 'Allow authenticated read access for specialties'
  ) THEN
    CREATE POLICY "Allow authenticated read access for specialties"
      ON specialties FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'geographic_regions' 
    AND policyname = 'Allow authenticated read access for geographic_regions'
  ) THEN
    CREATE POLICY "Allow authenticated read access for geographic_regions"
      ON geographic_regions FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'creative_templates' 
    AND policyname = 'Allow authenticated read access for creative_templates'
  ) THEN
    CREATE POLICY "Allow authenticated read access for creative_templates"
      ON creative_templates FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaigns' 
    AND policyname = 'Allow authenticated full access to own campaigns'
  ) THEN
    CREATE POLICY "Allow authenticated full access to own campaigns"
      ON campaigns FOR ALL TO authenticated
      USING (auth.uid() = created_by)
      WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaign_results' 
    AND policyname = 'Allow authenticated read access to own campaign results'
  ) THEN
    CREATE POLICY "Allow authenticated read access to own campaign results"
      ON campaign_results FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM campaigns
        WHERE campaigns.id = campaign_results.campaign_id
        AND campaigns.created_by = auth.uid()
      ));
  END IF;
END $$;