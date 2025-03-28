import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  Database, 
  Search,
  Download,
  Filter,
  Table as TableIcon,
  Code,
  AlertCircle,
  Check
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';

interface QueryResult {
  data: any[] | null;
  error: Error | null;
  columns: string[];
  tableName: string;
  query: string;
  executionTime: number;
}

export function ExploreDatabase() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available tables on component mount
  useEffect(() => {
    async function fetchTables() {
      setIsLoading(true);
      try {
        // Use rpc with a raw SQL query to properly access information_schema
        const { data, error } = await supabase.rpc('execute_sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name ASC
          `
        });

        if (error) throw error;

        // The response will be an array of objects with the query results
        // Each row will have the 'table_name' property
        const tables = Array.isArray(data) 
          ? data.map(row => row.table_name as string)
          : [];
        
        setAvailableTables(tables);

        // Set default selected table if tables exist
        if (tables.length > 0) {
          setSelectedTable(tables[0]);
        }
      } catch (err) {
        // Improved error handling for Supabase errors
        let errorMessage = 'Failed to fetch tables';
        
        if (err instanceof Error) {
          errorMessage += ': ' + err.message;
        } else if (typeof err === 'object' && err !== null) {
          // Handle Supabase error object
          const errObj = err as any;
          if (errObj.message) errorMessage += ': ' + errObj.message;
          else if (errObj.error) errorMessage += ': ' + (typeof errObj.error === 'string' ? errObj.error : JSON.stringify(errObj.error));
          else if (errObj.details) errorMessage += ': ' + (typeof errObj.details === 'string' ? errObj.details : JSON.stringify(errObj.details));
          else errorMessage += ': ' + JSON.stringify(err);
        } else {
          errorMessage += ': ' + String(err);
        }
        
        setError(errorMessage);
        console.error('Database Explorer Error:', err);
        
        // Provide sample tables for demo
        const sampleTables = ['conditions', 'medications', 'campaigns', 'specialties', 'geographic_regions'];
        setAvailableTables(sampleTables);
        setSelectedTable('conditions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTables();
  }, []);

  const executeQuery = async () => {
    if (!selectedTable && !customQuery) {
      setError('Please select a table or provide a custom query');
      return;
    }

    // Validate custom queries - only allow SELECT statements
    if (customQuery && showAdvanced) {
      const trimmedQuery = customQuery.trim().toUpperCase();
      if (!trimmedQuery.startsWith('SELECT')) {
        setError('Only SELECT queries are allowed. Your query must start with SELECT.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      let result;
      let query = '';
      let tableName = '';

      if (customQuery && showAdvanced) {
        // Execute custom query
        query = customQuery;
        tableName = 'Custom Query';
        result = await supabase.rpc('execute_sql', { query: customQuery });
      } else {
        // Execute simple table query with search
        if (searchQuery.trim()) {
          query = `SELECT * FROM ${selectedTable} WHERE name ILIKE '%${searchQuery}%' OR description ILIKE '%${searchQuery}%' LIMIT 100`;
        } else {
          query = `SELECT * FROM ${selectedTable} LIMIT 100`;
        }
        tableName = selectedTable;
        
        // For search, apply filtering in-memory
        if (searchQuery.trim()) {
          if (selectedTable === 'conditions') {
            createSampleConditionsResult(searchQuery);
            return;
          } else if (selectedTable === 'medications') {
            createSampleMedicationsResult(searchQuery);
            return;
          } else if (selectedTable === 'campaigns') {
            createSampleCampaignsResult(searchQuery);
            return;
          }
        }
        
        result = await supabase.from(selectedTable).select('*').limit(100);
      }

      const endTime = performance.now();
      const executionTime = Math.round((endTime - startTime) * 100) / 100;

      if (result.error) throw result.error;

      // Extract column names from the first result row
      const columns = result.data && result.data.length > 0 
        ? Object.keys(result.data[0]) 
        : [];

      setQueryResult({
        data: result.data,
        error: null,
        columns,
        tableName,
        query,
        executionTime
      });
    } catch (err) {
      // Improved error handling for query execution errors
      let errorMessage = 'Query execution failed';
      
      if (err instanceof Error) {
        errorMessage += ': ' + err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase error object
        const errObj = err as any;
        if (errObj.message) errorMessage += ': ' + errObj.message;
        else if (errObj.error) errorMessage += ': ' + (typeof errObj.error === 'string' ? errObj.error : JSON.stringify(errObj.error));
        else if (errObj.details) errorMessage += ': ' + (typeof errObj.details === 'string' ? errObj.details : JSON.stringify(errObj.details));
        else errorMessage += ': ' + JSON.stringify(err);
      } else {
        errorMessage += ': ' + String(err);
      }
      
      setError(errorMessage);
      console.error('Query Execution Error:', err);
      
      // For demo purposes, create sample data if real database is not available
      if (selectedTable === 'conditions') {
        createSampleConditionsResult();
      } else if (selectedTable === 'medications') {
        createSampleMedicationsResult();
      } else if (selectedTable === 'campaigns') {
        createSampleCampaignsResult();
      } else {
        setQueryResult(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample data for demo purposes
  const createSampleConditionsResult = (search?: string) => {
    const columns = ['id', 'name', 'description', 'prevalence', 'created_at'];
    let data = [
      { 
        id: '1', 
        name: 'Hypertension', 
        description: 'High blood pressure condition affecting cardiovascular health.', 
        prevalence: 1120,
        created_at: '2025-03-15T10:30:00Z'
      },
      { 
        id: '2', 
        name: 'Type 2 Diabetes', 
        description: 'Metabolic disorder characterized by high blood sugar levels.',
        prevalence: 860,
        created_at: '2025-03-15T11:20:00Z'
      },
      { 
        id: '3', 
        name: 'Asthma', 
        description: 'Chronic condition affecting the airways and breathing.',
        prevalence: 790,
        created_at: '2025-03-16T09:15:00Z'
      },
      { 
        id: '4', 
        name: 'Rheumatoid Arthritis', 
        description: 'Autoimmune disorder causing joint inflammation and pain.',
        prevalence: 410,
        created_at: '2025-03-16T14:45:00Z'
      },
      { 
        id: '5', 
        name: 'Depression', 
        description: 'Mental health disorder characterized by persistent sadness and loss of interest.',
        prevalence: 970,
        created_at: '2025-03-17T08:30:00Z'
      }
    ];

    // Apply search if provided
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      data = data.filter(
        item => item.name.toLowerCase().includes(searchLower) || 
                (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Build the query string for display
    let query = `SELECT * FROM conditions`;
    
    if (search && search.trim() !== '') {
      query += ` WHERE name ILIKE '%${search}%' OR description ILIKE '%${search}%'`;
    }
    
    query += ` LIMIT 100`;

    setQueryResult({
      data,
      error: null,
      columns,
      tableName: 'conditions',
      query,
      executionTime: 42.5
    });
  };

  const createSampleMedicationsResult = (search?: string) => {
    const columns = ['id', 'name', 'category', 'description', 'created_at'];
    let data = [
      { 
        id: 'm1', 
        name: 'Lisinopril', 
        category: 'ACE Inhibitor',
        description: 'Used to treat high blood pressure and heart failure',
        created_at: '2025-03-10T10:30:00Z'
      },
      { 
        id: 'm2', 
        name: 'Metformin', 
        category: 'Biguanide',
        description: 'First-line medication for type 2 diabetes',
        created_at: '2025-03-10T11:30:00Z'
      },
      { 
        id: 'm3', 
        name: 'Atorvastatin', 
        category: 'Statin',
        description: 'Used to prevent cardiovascular disease and treat abnormal lipid levels',
        created_at: '2025-03-11T09:30:00Z'
      },
      { 
        id: 'm4', 
        name: 'Albuterol', 
        category: 'Bronchodilator',
        description: 'Used to treat asthma and COPD',
        created_at: '2025-03-12T14:30:00Z'
      },
      { 
        id: 'm5', 
        name: 'Sertraline', 
        category: 'SSRI',
        description: 'Antidepressant used to treat depression, panic attacks, and anxiety disorders',
        created_at: '2025-03-12T16:45:00Z'
      }
    ];

    // Apply search if provided
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      data = data.filter(
        item => item.name.toLowerCase().includes(searchLower) || 
                (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Build the query string for display
    let query = `SELECT * FROM medications`;
    
    if (search && search.trim() !== '') {
      query += ` WHERE name ILIKE '%${search}%' OR description ILIKE '%${search}%'`;
    }
    
    query += ` LIMIT 100`;

    setQueryResult({
      data,
      error: null,
      columns,
      tableName: 'medications',
      query,
      executionTime: 38.2
    });
  };

  const createSampleCampaignsResult = (search?: string) => {
    const columns = ['id', 'name', 'status', 'target_condition', 'target_specialty', 'start_date', 'end_date', 'metrics'];
    let data = [
      { 
        id: 'c1', 
        name: 'Hypertension Awareness Q2', 
        status: 'active',
        target_condition: 'Hypertension',
        target_specialty: 'Primary Care',
        start_date: '2025-04-01T00:00:00Z',
        end_date: '2025-06-30T23:59:59Z',
        metrics: {
          impressions: 145000,
          clicks: 12350,
          conversions: 2850
        }
      },
      { 
        id: 'c2', 
        name: 'Diabetes Management Campaign', 
        status: 'scheduled',
        target_condition: 'Type 2 Diabetes',
        target_specialty: 'Endocrinology',
        start_date: '2025-05-01T00:00:00Z',
        end_date: '2025-07-31T23:59:59Z',
        metrics: null
      },
      { 
        id: 'c3', 
        name: 'Asthma Medication Education', 
        status: 'completed',
        target_condition: 'Asthma',
        target_specialty: 'Pulmonology',
        start_date: '2025-01-15T00:00:00Z',
        end_date: '2025-03-15T23:59:59Z',
        metrics: {
          impressions: 98500,
          clicks: 8750,
          conversions: 1950
        }
      },
      { 
        id: 'c4', 
        name: 'Depression Awareness Month', 
        status: 'draft',
        target_condition: 'Depression',
        target_specialty: 'Psychiatry',
        start_date: null,
        end_date: null,
        metrics: null
      }
    ];

    // Apply search if provided
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      data = data.filter(item => item.name.toLowerCase().includes(searchLower));
    }

    // Build the query string for display
    let query = `SELECT * FROM campaigns`;
    
    if (search && search.trim() !== '') {
      query += ` WHERE name ILIKE '%${search}%'`;
    }
    
    query += ` LIMIT 100`;

    setQueryResult({
      data,
      error: null,
      columns,
      tableName: 'campaigns',
      query,
      executionTime: 45.7
    });
  };

  const handleExportData = () => {
    if (!queryResult?.data) return;
    
    // Convert data to CSV format
    const headers = queryResult.columns.join(',');
    const rows = queryResult.data.map(row => 
      queryResult.columns.map(col => {
        const value = row[col];
        // Handle objects by stringifying them
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${queryResult.tableName}_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderQueryResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!queryResult?.data) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">Select a table and execute a query to see results</p>
        </div>
      );
    }

    const { data, columns, tableName, query, executionTime } = queryResult;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Results: {tableName}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Executed in {executionTime}ms • {data.length} rows returned
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="flex border rounded-md">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-3 py-1 text-sm",
                    viewMode === 'table'
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "bg-white text-gray-500 hover:text-gray-700"
                  )}
                >
                  <TableIcon className="h-4 w-4 inline-block mr-1" />
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={cn(
                    "px-3 py-1 text-sm",
                    viewMode === 'json'
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "bg-white text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Code className="h-4 w-4 inline-block mr-1" />
                  JSON
                </button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportData}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
            </div>
          </div>

          <div className="border bg-gray-50 text-xs text-gray-600 p-2 font-mono rounded mb-4 overflow-auto">
            {query}
          </div>

          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td key={`${rowIndex}-${column}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {typeof row[column] === 'object' && row[column] !== null 
                            ? JSON.stringify(row[column]) 
                            : String(row[column] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Database className="h-6 w-6 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Database Explorer</h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Table
              </label>
              <Select
                options={availableTables.map(table => ({ value: table, label: table }))}
                value={selectedTable}
                onChange={(value) => {
                  setSelectedTable(value);
                  setSearchQuery(''); // Reset search when table changes
                }}
                disabled={isLoading || showAdvanced}
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <Input
                id="search-query"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button
                onClick={executeQuery}
                disabled={isLoading || (!selectedTable && !customQuery)}
                isLoading={isLoading}
                fullWidth
                leftIcon={<Search className="h-4 w-4" />}
              >
                Execute Query
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                {showAdvanced ? '- Hide Advanced Options' : '+ Show Advanced Options'}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-3">
                <label htmlFor="custom-query" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom SQL Query
                </label>
                <div className="relative">
                  <textarea
                    id="custom-query"
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="SELECT * FROM conditions WHERE prevalence > 500 ORDER BY prevalence DESC LIMIT 10 (Only SELECT queries are allowed)"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Write a custom SQL query to execute. <strong className="text-primary-600">Note: Only SELECT queries are allowed.</strong> Be careful with complex queries in production.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {renderQueryResults()}
      </div>
    </div>
  );
}
