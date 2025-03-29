/*
  # Create database functions for better metadata handling
  
  This file adds custom functions (RPCs) to support database operations
  without relying on information_schema, which causes issues in Supabase.
*/

-- Function to get tables without using information_schema
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_name text,
  table_schema text,
  description text
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    c.relname AS table_name,
    n.nspname AS table_schema,
    d.description AS description
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = 0
  WHERE c.relkind = 'r' 
    AND n.nspname = 'public'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE 'sql_%'
  ORDER BY c.relname;
$$;

-- Function to get table columns without using information_schema
CREATE OR REPLACE FUNCTION get_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text,
  description text
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    NOT a.attnotnull AS is_nullable,
    (
      SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid)
      FROM pg_catalog.pg_attrdef d
      WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum
      AND a.atthasdef
    ) AS column_default,
    pd.description AS description
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
  JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
  LEFT JOIN pg_catalog.pg_description pd ON pd.objoid = a.attrelid AND pd.objsubid = a.attnum
  WHERE n.nspname = 'public'
    AND c.relname = table_name
    AND a.attnum > 0
    AND NOT a.attisdropped
  ORDER BY a.attnum;
$$;

-- Function to get prescriptions by provider specialty
CREATE OR REPLACE FUNCTION get_prescriptions_by_specialty()
RETURNS TABLE (
  specialty text,
  prescription_count bigint,
  provider_count bigint
) SECURITY DEFINER LANGUAGE SQL AS $$
  SELECT 
    p.specialty,
    COUNT(pr.id) AS prescription_count,
    COUNT(DISTINCT p.id) AS provider_count
  FROM providers p
  LEFT JOIN prescriptions pr ON p.id = pr.provider_id
  GROUP BY p.specialty
  ORDER BY prescription_count DESC;
$$;

-- Function to get prescriptions by geographic region
CREATE OR REPLACE FUNCTION get_prescriptions_by_region()
RETURNS TABLE (
  region_name text,
  prescription_count bigint
) SECURITY DEFINER LANGUAGE SQL AS $$
  SELECT 
    gr.name AS region_name,
    COUNT(p.id) AS prescription_count
  FROM prescriptions p
  JOIN geographic_regions gr ON p.prescription_location = gr.id
  WHERE gr.type IN ('Region', 'State', 'Metro')
  GROUP BY gr.name
  ORDER BY prescription_count DESC;
$$;

-- Function to get campaign performance metrics
CREATE OR REPLACE FUNCTION get_campaign_performance(campaign_id uuid)
RETURNS TABLE (
  date_period date,
  impressions integer,
  clicks integer,
  conversions integer,
  prescription_count integer
) SECURITY DEFINER LANGUAGE SQL AS $$
  SELECT 
    cr.report_date::date AS date_period,
    (cr.metrics->>'impressions')::integer AS impressions,
    (cr.metrics->>'clicks')::integer AS clicks,
    (cr.metrics->>'conversions')::integer AS conversions,
    COUNT(p.id) AS prescription_count
  FROM campaigns c
  JOIN campaign_results cr ON c.id = cr.campaign_id
  LEFT JOIN prescriptions p ON 
    p.condition_id = c.target_condition_id AND
    p.medication_id = c.target_medication_id AND
    p.prescription_date::date >= c.start_date::date AND
    p.prescription_date::date <= COALESCE(c.end_date::date, CURRENT_DATE)
  WHERE c.id = campaign_id
  GROUP BY cr.report_date::date, cr.metrics
  ORDER BY date_period;
$$;

-- Function to calculate ROI for campaigns
CREATE OR REPLACE FUNCTION get_campaign_roi(campaign_id uuid)
RETURNS TABLE (
  campaign_name text,
  total_impressions integer,
  total_clicks integer, 
  total_conversions integer,
  total_prescriptions integer,
  estimated_roi numeric
) SECURITY DEFINER LANGUAGE SQL AS $$
  WITH campaign_data AS (
    SELECT 
      c.name AS campaign_name,
      SUM((cr.metrics->>'impressions')::integer) AS total_impressions,
      SUM((cr.metrics->>'clicks')::integer) AS total_clicks,
      SUM((cr.metrics->>'conversions')::integer) AS total_conversions,
      COUNT(p.id) AS total_prescriptions
    FROM campaigns c
    JOIN campaign_results cr ON c.id = cr.campaign_id
    LEFT JOIN prescriptions p ON 
      p.condition_id = c.target_condition_id AND
      p.medication_id = c.target_medication_id AND
      p.prescription_date::date >= c.start_date::date AND
      p.prescription_date::date <= COALESCE(c.end_date::date, CURRENT_DATE)
    WHERE c.id = campaign_id
    GROUP BY c.name
  )
  SELECT 
    campaign_name,
    total_impressions,
    total_clicks,
    total_conversions,
    total_prescriptions,
    -- Estimated ROI formula (example)
    CASE 
      WHEN total_impressions > 0 THEN 
        (total_prescriptions::numeric * 150) / (total_impressions::numeric * 0.002)
      ELSE 0
    END AS estimated_roi
  FROM campaign_data;
$$;

-- Create secure policy for these functions 
DO $$
BEGIN
  ALTER FUNCTION get_tables() SET search_path = public;
  ALTER FUNCTION get_columns(text) SET search_path = public;
  ALTER FUNCTION get_prescriptions_by_specialty() SET search_path = public;
  ALTER FUNCTION get_prescriptions_by_region() SET search_path = public;
  ALTER FUNCTION get_campaign_performance(uuid) SET search_path = public;
  ALTER FUNCTION get_campaign_roi(uuid) SET search_path = public;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
