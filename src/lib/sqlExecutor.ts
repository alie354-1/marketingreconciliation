import { supabase } from './supabase';

/**
 * Safely execute SQL queries through Supabase RPC
 * This ensures that only SELECT queries are passed to execute_sql
 */
export const executeSql = async (query: string) => {
  // Trim whitespace and ensure query starts with SELECT
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery.toUpperCase().startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed for security reasons');
  }
  
  try {
    // Execute the validated query through the Supabase RPC function
    const { data, error } = await supabase.rpc('execute_sql', { 
      query: trimmedQuery 
    });
    
    if (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error('SQL execution failed:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'An error occurred during SQL execution',
        details: error.details || null,
        code: error.code || 'UNKNOWN'
      } 
    };
  }
};

/**
 * Get tables using a direct SQL query
 * This provides an alternative to the get_tables RPC function
 */
export const fetchTablesViaSql = async () => {
  const query = `
    SELECT 
      tablename AS table_name,
      tableowner AS owner,
      tablespace,
      hasindexes AS has_indexes,
      hasrules AS has_rules,
      hastriggers AS has_triggers
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  
  return await executeSql(query);
};

/**
 * Get columns for a specific table using a direct SQL query
 */
export const fetchTableColumnsViaSql = async (tableName: string) => {
  // Validate table name to prevent SQL injection
  if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
    throw new Error('Invalid table name');
  }
  
  const query = `
    SELECT 
      a.attname AS column_name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
      a.attnotnull AS is_not_null,
      (
        SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid)
        FROM pg_catalog.pg_attrdef d
        WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef
      ) AS default_value,
      a.attnum AS ordinal_position
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE 
      n.nspname = 'public' AND
      c.relname = '${tableName}' AND
      a.attnum > 0 AND
      NOT a.attisdropped
    ORDER BY a.attnum
  `;
  
  return await executeSql(query);
};

/**
 * Safely fetch sample data from a table using a direct SQL query
 */
export const fetchTableDataViaSql = async (tableName: string, limit: number = 100) => {
  // Validate table name to prevent SQL injection
  if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
    throw new Error('Invalid table name');
  }
  
  const query = `
    SELECT * FROM ${tableName}
    LIMIT ${Math.min(1000, limit)} -- Cap at 1000 rows for safety
  `;
  
  return await executeSql(query);
};
