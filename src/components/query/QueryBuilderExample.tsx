import React from 'react';
import { QueryField, QueryExpression, LogicalExpression } from '../../types';
import { QueryBuilder } from './QueryBuilder';
import { createDefaultExpression, expressionToSQL } from '../../lib/queryBuilderV2';

// Example component to demonstrate usage of QueryBuilder
export const QueryBuilderExample: React.FC = () => {
  const [expression, setExpression] = React.useState<QueryExpression>(createDefaultExpression());
  const [isValid, setIsValid] = React.useState(true);
  const [sqlQuery, setSqlQuery] = React.useState('');
  
  // Example fields that might come from your database schema
  const fields: QueryField[] = [
    { 
      id: 'medication_id', 
      name: 'medications.id', 
      label: 'Medication',
      type: 'string',
      options: [
        { value: 'med-123', label: 'Advil' },
        { value: 'med-456', label: 'Tylenol' },
        { value: 'med-789', label: 'Aspirin' }
      ]
    },
    { 
      id: 'condition_id', 
      name: 'conditions.id', 
      label: 'Condition',
      type: 'string',
      options: [
        { value: 'cond-123', label: 'Headache' },
        { value: 'cond-456', label: 'Fever' },
        { value: 'cond-789', label: 'Common Cold' }
      ]
    },
    { 
      id: 'geographic_area', 
      name: 'providers.geographic_area', 
      label: 'Geographic Area',
      type: 'string',
      options: [
        { value: 'northeast', label: 'Northeast' },
        { value: 'midwest', label: 'Midwest' },
        { value: 'south', label: 'South' },
        { value: 'west', label: 'West' }
      ]
    },
    { 
      id: 'specialty', 
      name: 'providers.specialty', 
      label: 'Specialty',
      type: 'string',
      options: [
        { value: 'cardiology', label: 'Cardiology' },
        { value: 'neurology', label: 'Neurology' },
        { value: 'pediatrics', label: 'Pediatrics' },
        { value: 'family-medicine', label: 'Family Medicine' }
      ]
    },
    { 
      id: 'prescription_count', 
      name: 'prescriptions.count', 
      label: 'Prescription Count',
      type: 'number'
    },
    { 
      id: 'active', 
      name: 'providers.active', 
      label: 'Active Status',
      type: 'boolean'
    },
    { 
      id: 'last_prescription_date', 
      name: 'prescriptions.last_date', 
      label: 'Last Prescription Date',
      type: 'date'
    }
  ];

  const handleExpressionChange = (newExpression: QueryExpression) => {
    setExpression(newExpression);
    
    // Generate SQL when expression changes
    if (isLogicalExpression(newExpression)) {
      try {
        const { sql, params } = expressionToSQL(newExpression, fields);
        setSqlQuery(`SELECT * FROM providers
WHERE ${sql}
-- Parameters: ${JSON.stringify(params)}`);
      } catch (err) {
        console.error('Error generating SQL:', err);
        setSqlQuery('Error generating SQL');
      }
    }
  };

  // Type guard
  const isLogicalExpression = (expr: QueryExpression): expr is LogicalExpression => {
    return expr.type === 'logical';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Campaign Targeting Query Builder</h2>
      
      <div className="mb-6">
        <QueryBuilder
          availableFields={fields}
          initialExpression={expression}
          onChange={handleExpressionChange}
          onValidationChange={setIsValid}
          showPreview={true}
        />
      </div>
      
      {sqlQuery && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Generated SQL Query:</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
            {sqlQuery}
          </pre>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <button
          disabled={!isValid}
          className={`px-4 py-2 rounded-md ${
            isValid 
              ? 'bg-primary-500 text-white hover:bg-primary-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Save Query
        </button>
      </div>
    </div>
  );
};
