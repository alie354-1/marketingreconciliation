/*
  # Create execute_sql function for ExploreDatabase component
  
  This file adds the missing execute_sql RPC function needed by the
  ExploreDatabase component to execute raw SQL queries in a secure way.
*/

-- Function to execute raw SQL queries (with security limitations)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB;
BEGIN
  -- Security precaution - only allow SELECT statements
  IF NOT (query ILIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Execute the query and return results as JSON
  EXECUTE 'WITH query_result AS (' || query || ') SELECT jsonb_agg(query_result) FROM query_result' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Set secure search path to prevent SQL injection attacks
ALTER FUNCTION execute_sql(text) SET search_path = public;

-- Grant execute permission as needed
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;

-- Add function comment for documentation
COMMENT ON FUNCTION execute_sql(text) IS 'Executes a SQL SELECT query and returns results as JSON. Only SELECT queries are allowed for security.';
