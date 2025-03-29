import { supabase } from './supabase';

/**
 * Database metadata helpers that avoid direct information_schema queries
 * which can cause issues with Supabase's PostgreSQL setup
 */

/**
 * Get all available tables in the public schema without using information_schema
 */
export async function fetchTables() {
  // Use pg_catalog approach rather than information_schema
  const { data, error } = await supabase.rpc('get_tables');
  
  if (error) {
    console.error('Error fetching tables:', error);
    throw new Error(`Failed to fetch tables: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get columns for a specific table without using information_schema
 */
export async function fetchTableColumns(tableName: string) {
  const { data, error } = await supabase.rpc('get_columns', { table_name: tableName });
  
  if (error) {
    console.error(`Error fetching columns for table ${tableName}:`, error);
    throw new Error(`Failed to fetch columns: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Execute a safe query against a specific table with proper error handling
 */
export async function fetchTableData(tableName: string, columns: string[] = ['*'], limit: number = 100) {
  try {
    // Sanitize the table name to prevent SQL injection
    if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
      throw new Error('Invalid table name');
    }
    
    // Sanitize the columns to prevent SQL injection
    const sanitizedColumns = columns.map(col => {
      if (col !== '*' && !col.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error(`Invalid column name: ${col}`);
      }
      return col;
    });
    
    const { data, error } = await supabase
      .from(tableName)
      .select(sanitizedColumns.join(','))
      .limit(limit);
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return { data: null, error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Safely fetch campaign data with related metrics
 */
export async function fetchCampaignsWithMetrics() {
  try {
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_results(metrics)
      `);
      
    if (campaignError) throw campaignError;
    
    // Process campaigns and calculate metrics
    const processedCampaigns = campaigns?.map(campaign => {
      const results = campaign.campaign_results || [];
      
      // Calculate aggregate metrics from all result entries
      const metrics = results.reduce((acc: any, result: any) => {
        const resultMetrics = result.metrics || {};
        
        // Sum up all numeric metrics
        Object.entries(resultMetrics).forEach(([key, value]) => {
          if (typeof value === 'number') {
            acc[key] = (acc[key] || 0) + value;
          }
        });
        
        return acc;
      }, {});
      
      return {
        ...campaign,
        aggregated_metrics: metrics
      };
    });
    
    return { data: processedCampaigns, error: null };
  } catch (error: any) {
    console.error('Error fetching campaigns with metrics:', error);
    return { data: null, error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Get prescription metrics by provider specialty
 */
export async function fetchPrescriptionsBySpecialty() {
  try {
    const { data, error } = await supabase.rpc('get_prescriptions_by_specialty');
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching prescriptions by specialty:', error);
    return { data: null, error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Get geographic distribution of prescriptions
 */
export async function fetchPrescriptionsByRegion() {
  try {
    const { data, error } = await supabase.rpc('get_prescriptions_by_region');
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching prescriptions by region:', error);
    return { data: null, error: error.message || 'An unknown error occurred' };
  }
}
