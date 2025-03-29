import React, { useState, useEffect } from 'react';
import type { QueryField, QueryExpression, LogicalExpression, ValidationResult } from '../../types/query';
import { QueryBuilder } from './QueryBuilder';
import { createDefaultExpression, expressionToSQL } from '../../lib/queryBuilderV2';
import { executeSql } from '../../lib/sqlExecutor';
import { Button } from '../ui/Button';
import { AlertCircle, Database, Play, Save, Copy, Download } from 'lucide-react';

interface SQLQueryBuilderProps {
  availableFields: QueryField[];
  initialExpression?: QueryExpression;
  onSaveQuery?: (expression: QueryExpression, name: string) => Promise<void>;
  onExecuteQuery?: (sql: string, params: any[]) => Promise<any>;
  className?: string;
  showPreview?: boolean;
  defaultLimit?: number;
  maxResults?: number;
  allowExport?: boolean;
}

export const SqlQueryBuilder: React.FC<SQLQueryBuilderProps> = ({
  availableFields,
  initialExpression,
  onSaveQuery,
  onExecuteQuery,
  className,
  showPreview = true,
  defaultLimit = 100,
  maxResults = 1000,
  allowExport = true
}) => {
  const [expression, setExpression] = useState<QueryExpression>(
    initialExpression || createDefaultExpression()
  );
  const [isValid, setIsValid] = useState(true);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryParams, setQueryParams] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryName, setQueryName] = useState('');
  const [limit, setLimit] = useState(defaultLimit);
  
  // Generate SQL when expression changes
  useEffect(() => {
    if (isLogicalExpression(expression)) {
      try {
        const { sql, params } = expressionToSQL(expression, availableFields);
        // Ensure we're always starting with a SELECT statement for the execute_sql function
        const fullQuery = `SELECT * FROM providers
WHERE ${sql}
LIMIT ${limit}`;
        setSqlQuery(fullQuery);
        setQueryParams(params);
        setError(null);
      } catch (err) {
        console.error('Error generating SQL:', err);
        setError('Error generating SQL query');
        setSqlQuery('');
        setQueryParams([]);
      }
    }
  }, [expression, availableFields, limit]);

  // Handle expression changes from the query builder
  const handleExpressionChange = (newExpression: QueryExpression) => {
    setExpression(newExpression);
  };

  // Handle validation changes
  const handleValidationChange = (valid: boolean) => {
    setIsValid(valid);
  };

  // Type guard
  const isLogicalExpression = (expr: QueryExpression): expr is LogicalExpression => {
    return expr.type === 'logical';
  };

  // Execute the query
  const executeQuery = async () => {
    if (!sqlQuery || !isValid) return;
    
    setIsExecuting(true);
    setError(null);
    setQueryResults(null);
    
    try {
      let results;
      
      if (onExecuteQuery) {
        // Use the provided execution function if available
        results = await onExecuteQuery(sqlQuery, queryParams);
      } else {
        // Use our safe SQL executor
        const { data, error } = await executeSql(sqlQuery);
        
        if (error) throw error;
        results = data;
      }
      
      if (results && results.length > maxResults) {
        setError(`Query returned ${results.length} results, but only ${maxResults} will be displayed.`);
        results = results.slice(0, maxResults);
      }
      
      setQueryResults(results);
    } catch (err) {
      console.error('Error executing query:', err);
      setError(`Error executing query: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Save the query
  const saveQuery = async () => {
    if (!queryName || !isValid || !onSaveQuery) return;
    
    try {
      await onSaveQuery(expression, queryName);
      // Optionally show a success message
    } catch (err) {
      console.error('Error saving query:', err);
      setError(`Error saving query: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Export results to CSV
  const exportToCsv = () => {
    if (!queryResults || queryResults.length === 0) return;
    
    try {
      // Get headers
      const headers = Object.keys(queryResults[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...queryResults.map(row => 
          headers.map(field => {
            const value = row[field];
            // Handle fields that might need quotes
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') {
              // Escape quotes and wrap in quotes
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          }).join(',')
        )
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `query_results_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setError(`Error exporting to CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Database className="mr-2 h-5 w-5 text-primary-500" />
          SQL Query Builder
        </h2>
        
        {/* Query Builder */}
        <div className="mb-6">
          <QueryBuilder
            availableFields={availableFields}
            initialExpression={expression}
            onChange={handleExpressionChange}
            onValidationChange={setIsValid}
            showPreview={false}
          />
        </div>
        
        {/* Limit control */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Result Limit
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="form-select block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value={10}>10 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={500}>500 rows</option>
            <option value={1000}>1000 rows</option>
          </select>
        </div>
        
        {/* Generated SQL */}
        {sqlQuery && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Generated SQL Query</label>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Copy className="h-3 w-3" />}
                onClick={() => navigator.clipboard.writeText(sqlQuery)}
              >
                Copy
              </Button>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
              {sqlQuery}
            </div>
          </div>
        )}
        
        {/* Validation errors */}
        {!isValid && validation.errors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="default"
            disabled={!isValid || isExecuting || !sqlQuery}
            isLoading={isExecuting}
            leftIcon={<Play className="h-4 w-4" />}
            onClick={executeQuery}
          >
            Execute Query
          </Button>
          
          {onSaveQuery && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Query name"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <Button
                variant="outline"
                disabled={!isValid || !queryName || !sqlQuery}
                leftIcon={<Save className="h-4 w-4" />}
                onClick={saveQuery}
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Query Results */}
      {(queryResults || error) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Query Results</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mr-2" />
                <div className="text-sm font-medium text-red-800">{error}</div>
              </div>
            </div>
          )}
          
          {queryResults && queryResults.length > 0 ? (
            <div>
              {allowExport && (
                <div className="flex justify-end mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={exportToCsv}
                  >
                    Export to CSV
                  </Button>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {queryResults.length > 0 && Object.keys(queryResults[0]).map(key => (
                        <th
                          key={key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queryResults.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {value === null || value === undefined 
                              ? <span className="text-gray-400 italic">null</span>
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-3 text-sm text-gray-500">
                Showing {queryResults.length} {queryResults.length === 1 ? 'row' : 'rows'}
              </div>
            </div>
          ) : queryResults && queryResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No results found for this query
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
