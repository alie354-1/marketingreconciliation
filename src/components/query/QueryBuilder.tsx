import React, { useState, useEffect } from 'react';
import { 
  QueryExpression, 
  LogicalExpression, 
  ComparisonExpression, 
  QueryField,
  LogicalOperator,
  ComparisonOperator,
  FieldType
} from '../../types';
import { 
  createDefaultExpression, 
  createDefaultComparison, 
  expressionToString,
  validateExpression,
  isComparisonExpression,
  isLogicalExpression,
  getOperatorsForType
} from '../../lib/queryBuilderV2';
import { cn } from '../../utils/cn';
import { 
  PlusCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  GripVertical, 
  Copy,
  AlertCircle
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface QueryBuilderProps {
  availableFields: QueryField[];
  initialExpression?: QueryExpression;
  onChange: (expression: QueryExpression) => void;
  onValidationChange?: (isValid: boolean) => void;
  showPreview?: boolean;
  readOnly?: boolean;
  className?: string;
  maxDepth?: number;
  allowEmptyGroups?: boolean;
  showValidationErrors?: boolean;
}

// Utility function to format operator names for display
function formatOperator(operator: string): string {
  switch (operator) {
    case 'equals': return 'equals';
    case 'not_equals': return 'not equals';
    case 'greater_than': return 'greater than';
    case 'less_than': return 'less than';
    case 'greater_than_equals': return 'greater than or equals';
    case 'less_than_equals': return 'less than or equals';
    case 'contains': return 'contains';
    case 'not_contains': return 'does not contain';
    case 'starts_with': return 'starts with';
    case 'ends_with': return 'ends with';
    case 'in': return 'in';
    case 'not_in': return 'not in';
    case 'is_null': return 'is null';
    case 'is_not_null': return 'is not null';
    default: return operator;
  }
}

// Component to render a value input based on field type
const ValueInput: React.FC<{
  fieldType: FieldType;
  value: any;
  onChange: (value: any) => void;
  options?: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;
  operator: ComparisonOperator;
}> = ({ fieldType, value, onChange, options, disabled, operator }) => {
  // Skip value input for operators that don't need a value
  if (operator === 'is_null' || operator === 'is_not_null') {
    return null;
  }

  // If we have options, render a Select
  if (options && options.length > 0) {
    return (
      <Select
        options={options}
        value={value === null ? '' : String(value)}
        onChange={(newValue) => onChange(newValue)}
        disabled={disabled}
      />
    );
  }

  switch (fieldType) {
    case 'number':
      return (
        <Input
          type="number"
          value={value === null ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
        />
      );
    case 'boolean':
      return (
        <Select
          options={[
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' }
          ]}
          value={value === null ? '' : String(value)}
          onChange={(newValue) => onChange(newValue === 'true')}
          disabled={disabled}
        />
      );
    default:
      return (
        <Input
          type="text"
          value={value === null ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          disabled={disabled}
        />
      );
  }
};

// Component to render a comparison expression
const ComparisonExpressionComponent: React.FC<{
  expression: ComparisonExpression;
  fields: QueryField[];
  onChange: (updated: ComparisonExpression) => void;
  onRemove: () => void;
  readOnly?: boolean;
}> = ({ expression, fields, onChange, onRemove, readOnly }) => {
  const field = fields.find(f => f.id === expression.field);
  
  // Get operators based on field type
  const operators = field ? getOperatorsForType(field.type) : [];
  
  return (
    <div className="flex flex-wrap items-start gap-3 p-4 rounded-md bg-white border border-gray-200 shadow-sm">
      <div className="flex-grow min-w-[200px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Target by
        </label>
        <Select
          options={fields.map(f => ({ value: f.id, label: f.label }))}
          value={expression.field}
          onChange={(value) => {
            const newField = fields.find(f => f.id === value);
            const newType = newField ? newField.type : 'string';
            const newOperators = newField ? getOperatorsForType(newType) : [];
            
            onChange({
              ...expression,
              field: value,
              fieldType: newType,
              operator: newOperators.length > 0 ? newOperators[0] : 'equals'
            });
          }}
          disabled={readOnly}
        />
      </div>
      
      <div className="w-[180px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Condition
        </label>
        <Select
          options={operators.map(op => ({ value: op, label: formatOperator(op) }))}
          value={expression.operator}
          onChange={(value) => onChange({
            ...expression,
            operator: value as ComparisonOperator,
            value: ['is_null', 'is_not_null'].includes(value) ? null : expression.value
          })}
          disabled={readOnly}
        />
      </div>
      
      <div className="flex-grow min-w-[200px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Value
        </label>
        <ValueInput
          fieldType={expression.fieldType}
          value={expression.value}
          onChange={(value) => onChange({ ...expression, value })}
          options={field?.options}
          disabled={readOnly}
          operator={expression.operator}
        />
      </div>
      
      {!readOnly && (
        <div className="flex items-end pb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-gray-500 hover:text-red-500"
            title="Remove this condition"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Component to render a logical expression (group of expressions)
const LogicalExpressionComponent: React.FC<{
  expression: LogicalExpression;
  fields: QueryField[];
  onChange: (updated: LogicalExpression) => void;
  onRemove?: () => void;
  readOnly?: boolean;
  depth: number;
  maxDepth: number;
  path: number[];
}> = ({ expression, fields, onChange, onRemove, readOnly, depth, maxDepth, path }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleOperatorChange = (operator: LogicalOperator) => {
    onChange({ ...expression, operator });
  };
  
  const handleAddExpression = (type: 'comparison' | 'logical') => {
    const newExpressions = [...expression.expressions];
    
    if (type === 'comparison' && fields.length > 0) {
      newExpressions.push(createDefaultComparison(fields[0]));
    } else if (type === 'logical') {
      newExpressions.push(createDefaultExpression());
    }
    
    onChange({ ...expression, expressions: newExpressions });
  };
  
  const handleRemoveExpression = (index: number) => {
    const newExpressions = [...expression.expressions];
    newExpressions.splice(index, 1);
    onChange({ ...expression, expressions: newExpressions });
  };
  
  const handleUpdateExpression = (index: number, updated: QueryExpression) => {
    const newExpressions = [...expression.expressions];
    newExpressions[index] = updated;
    onChange({ ...expression, expressions: newExpressions });
  };
  
  return (
    <div className={cn(
      "border rounded-md p-3 mt-2",
      depth === 0 ? "border-transparent" : "border-gray-300"
    )}>
      <div className="flex items-center justify-between mb-2">
        {depth > 0 && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 p-1 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <span className="ml-1 text-sm font-medium text-gray-700">
              Group ({expression.expressions.length})
            </span>
          </div>
        )}
        
        <div className="flex items-center">
          <Select
            options={[
              { value: 'and', label: 'AND' },
              { value: 'or', label: 'OR' },
              { value: 'not', label: 'NOT' },
            ]}
            value={expression.operator}
            onChange={(value) => handleOperatorChange(value as LogicalOperator)}
            disabled={readOnly}
            className="w-24"
          />
          
          {depth > 0 && !readOnly && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="ml-1 text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2">
          {expression.expressions.map((expr, index) => {
            const newPath = [...path, index];
            
            if (isComparisonExpression(expr)) {
              return (
                <ComparisonExpressionComponent
                  key={`comp-${newPath.join('-')}`}
                  expression={expr as ComparisonExpression}
                  fields={fields}
                  onChange={(updated) => handleUpdateExpression(index, updated)}
                  onRemove={() => handleRemoveExpression(index)}
                  readOnly={readOnly}
                />
              );
            }
            
            if (isLogicalExpression(expr) && depth < maxDepth) {
              return (
                <LogicalExpressionComponent
                  key={`group-${newPath.join('-')}`}
                  expression={expr as LogicalExpression}
                  fields={fields}
                  onChange={(updated) => handleUpdateExpression(index, updated)}
                  onRemove={() => handleRemoveExpression(index)}
                  readOnly={readOnly}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  path={newPath}
                />
              );
            }
            
            return null;
          })}
          
          {!readOnly && (
            <div className="flex items-center justify-start space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddExpression('comparison')}
                leftIcon={<PlusCircle className="h-3 w-3" />}
              >
                Add Condition
              </Button>
              
              {depth < maxDepth - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExpression('logical')}
                  leftIcon={<PlusCircle className="h-3 w-3" />}
                >
                  Add Group
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  availableFields,
  initialExpression,
  onChange,
  onValidationChange,
  showPreview = false, // Default changed to false to hide technical preview
  readOnly = false,
  className,
  maxDepth = 3,
  allowEmptyGroups = false,
  showValidationErrors = true
}) => {
  const [expression, setExpression] = useState<QueryExpression>(
    initialExpression || createDefaultExpression()
  );
  const [preview, setPreview] = useState<string>('');
  const [validation, setValidation] = useState<{ isValid: boolean, errors: string[] }>({
    isValid: true,
    errors: []
  });
  
  // For user-friendly display
  const [ruleCount, setRuleCount] = useState<number>(0);

  // Generate a preview of the expression (hidden from UI by default now)
  useEffect(() => {
    try {
      const previewText = expressionToString(expression, availableFields);
      setPreview(previewText);
      
      // Count the number of comparison expressions for user-friendly display
      let count = 0;
      const countExpressions = (expr: QueryExpression) => {
        if (isComparisonExpression(expr)) {
          count++;
        } else if (isLogicalExpression(expr)) {
          (expr as LogicalExpression).expressions.forEach(countExpressions);
        }
      };
      
      countExpressions(expression);
      setRuleCount(count);
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  }, [expression, availableFields]);

  // Validate the expression
  useEffect(() => {
    const result = validateExpression(expression, availableFields);
    setValidation(result);
    
    if (onValidationChange) {
      onValidationChange(result.isValid);
    }
  }, [expression, availableFields, onValidationChange]);

  // Use a debounced version of onChange to prevent infinite loops and excessive updates
  useEffect(() => {
    // Small delay to prevent rapid updates that could lead to performance issues
    const timeoutId = setTimeout(() => {
      onChange(expression);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [expression, onChange]);

  // When initialExpression prop changes, update our local state
  useEffect(() => {
    if (initialExpression) {
      setExpression(initialExpression);
    }
  }, [initialExpression]);

  const handleExpressionChange = (newExpression: QueryExpression) => {
    setExpression(newExpression);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* User-friendly summary header */}
      <div className="bg-primary-50 p-3 rounded-lg mb-3 border border-primary-100">
        <h3 className="text-sm font-medium text-primary-800 mb-1">Audience Targeting Builder</h3>
        <p className="text-xs text-primary-600">
          Build your target audience by adding criteria below. 
          You currently have {ruleCount} targeting {ruleCount === 1 ? 'criteria' : 'criteria'}.
        </p>
      </div>
      
      {isLogicalExpression(expression) && (
        <LogicalExpressionComponent
          expression={expression as LogicalExpression}
          fields={availableFields}
          onChange={handleExpressionChange}
          readOnly={readOnly}
          depth={0}
          maxDepth={maxDepth}
          path={[]}
        />
      )}
      
      {/* Hidden Preview - only shown when explicitly enabled */}
      {showPreview && preview && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Advanced Query View</label>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Copy className="h-3 w-3" />}
              onClick={() => navigator.clipboard.writeText(preview)}
            >
              Copy
            </Button>
          </div>
          <div className="bg-gray-50 p-3 rounded-md border text-sm font-mono whitespace-pre-wrap break-words">
            {preview}
          </div>
        </div>
      )}
      
      {/* Validation errors with more user-friendly messages */}
      {showValidationErrors && validation.errors.length > 0 && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Please Fix These Issues</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validation.errors.map((error, index) => {
                  // Replace technical error messages with more user-friendly ones
                  let userFriendlyError = error
                    .replace('Value is required for this operator', 'Please enter a value')
                    .replace('A numeric value is required', 'Please enter a number')
                    .replace('A boolean value is required', 'Please select Yes or No')
                    .replace('At least one expression is required', 'Please add at least one targeting criteria');
                    
                  return <li key={index}>{userFriendlyError}</li>;
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
