/**
 * Query Builder Helper Functions V2 - With Explicit Type Handling
 */

import { 
  QueryExpression, 
  LogicalExpression, 
  ComparisonExpression, 
  QueryField,
  FieldType,
  ComparisonOperator,
  LogicalOperator
} from '../types';

/**
 * Type guards for expressions
 */
export function isComparisonExpression(expr: QueryExpression): expr is ComparisonExpression {
  return expr.type === 'comparison';
}

export function isLogicalExpression(expr: QueryExpression): expr is LogicalExpression {
  return expr.type === 'logical';
}

/**
 * Formats a value for display in a query string
 */
function formatValue(value: any, fieldType?: FieldType): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (Array.isArray(value)) {
    return `[${value.map((v: any) => formatValue(v, fieldType)).join(', ')}]`;
  }
  
  switch (fieldType) {
    case 'string':
      return `"${value}"`;
    case 'date':
      return value instanceof Date ? value.toISOString() : `"${value}"`;
    default:
      return String(value);
  }
}

/**
 * Generates a human-readable string representation of a query expression
 */
export function expressionToString(expr: QueryExpression, fields: QueryField[]): string {
  if (expr.type === 'comparison') {
    // Safely cast to ComparisonExpression since we've checked the type
    const compExpr = expr as ComparisonExpression;
    const field = fields.find(f => f.id === compExpr.field);
    const fieldName = field?.label || compExpr.field;
    
    switch (compExpr.operator) {
      case 'equals':
        return `${fieldName} = ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'not_equals':
        return `${fieldName} ≠ ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'greater_than':
        return `${fieldName} > ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'less_than':
        return `${fieldName} < ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'greater_than_equals':
        return `${fieldName} ≥ ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'less_than_equals':
        return `${fieldName} ≤ ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'contains':
        return `${fieldName} contains ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'not_contains':
        return `${fieldName} does not contain ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'starts_with':
        return `${fieldName} starts with ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'ends_with':
        return `${fieldName} ends with ${formatValue(compExpr.value, compExpr.fieldType)}`;
      case 'in':
        if (Array.isArray(compExpr.value)) {
          return `${fieldName} in (${(compExpr.value as any[]).map((v: any) => formatValue(v, compExpr.fieldType)).join(', ')})`;
        }
        return `${fieldName} in (${formatValue(compExpr.value, compExpr.fieldType)})`;
      case 'not_in':
        if (Array.isArray(compExpr.value)) {
          return `${fieldName} not in (${(compExpr.value as any[]).map((v: any) => formatValue(v, compExpr.fieldType)).join(', ')})`;
        }
        return `${fieldName} not in (${formatValue(compExpr.value, compExpr.fieldType)})`;
      case 'is_null':
        return `${fieldName} is null`;
      case 'is_not_null':
        return `${fieldName} is not null`;
      default:
        return `${fieldName} ${compExpr.operator} ${formatValue(compExpr.value, compExpr.fieldType)}`;
    }
  } else if (expr.type === 'logical') {
    // Safely cast to LogicalExpression
    const logExpr = expr as LogicalExpression;
    const parts = logExpr.expressions.map(e => expressionToString(e, fields));
    
    if (logExpr.operator === 'not' && parts.length === 1) {
      return `NOT (${parts[0]})`;
    }
    
    const joinedParts = parts.join(` ${logExpr.operator.toUpperCase()} `);
    
    // Add parentheses if this is a nested expression
    return parts.length > 1 ? `(${joinedParts})` : joinedParts;
  }
  
  return ''; // This should never happen
}

/**
 * Converts a query expression to an SQL WHERE clause
 */
export function expressionToSQL(expr: QueryExpression, fields: QueryField[], paramIndex = 0): { sql: string, params: any[], nextParamIndex: number } {
  if (expr.type === 'comparison') {
    const compExpr = expr as ComparisonExpression;
    const field = fields.find(f => f.id === compExpr.field);
    const fieldName = field?.name || compExpr.field;
    
    if (['is_null', 'is_not_null'].includes(compExpr.operator)) {
      return {
        sql: `${fieldName} ${compExpr.operator === 'is_null' ? 'IS NULL' : 'IS NOT NULL'}`,
        params: [],
        nextParamIndex: paramIndex
      };
    }
    
    switch (compExpr.operator) {
      case 'equals':
        return {
          sql: `${fieldName} = $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'not_equals':
        return {
          sql: `${fieldName} != $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'greater_than':
        return {
          sql: `${fieldName} > $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'less_than':
        return {
          sql: `${fieldName} < $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'greater_than_equals':
        return {
          sql: `${fieldName} >= $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'less_than_equals':
        return {
          sql: `${fieldName} <= $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'contains':
        return {
          sql: `${fieldName} LIKE $${paramIndex + 1}`,
          params: [`%${compExpr.value}%`],
          nextParamIndex: paramIndex + 1
        };
      case 'not_contains':
        return {
          sql: `${fieldName} NOT LIKE $${paramIndex + 1}`,
          params: [`%${compExpr.value}%`],
          nextParamIndex: paramIndex + 1
        };
      case 'starts_with':
        return {
          sql: `${fieldName} LIKE $${paramIndex + 1}`,
          params: [`${compExpr.value}%`],
          nextParamIndex: paramIndex + 1
        };
      case 'ends_with':
        return {
          sql: `${fieldName} LIKE $${paramIndex + 1}`,
          params: [`%${compExpr.value}`],
          nextParamIndex: paramIndex + 1
        };
      case 'in':
        if (Array.isArray(compExpr.value)) {
          const placeholders = (compExpr.value as any[]).map((_, i) => `$${paramIndex + 1 + i}`).join(', ');
          return {
            sql: `${fieldName} IN (${placeholders})`,
            params: [...compExpr.value],
            nextParamIndex: paramIndex + compExpr.value.length
          };
        }
        return {
          sql: `${fieldName} IN ($${paramIndex + 1})`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'not_in':
        if (Array.isArray(compExpr.value)) {
          const placeholders = (compExpr.value as any[]).map((_, i) => `$${paramIndex + 1 + i}`).join(', ');
          return {
            sql: `${fieldName} NOT IN (${placeholders})`,
            params: [...compExpr.value],
            nextParamIndex: paramIndex + compExpr.value.length
          };
        }
        return {
          sql: `${fieldName} NOT IN ($${paramIndex + 1})`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
      default:
        return {
          sql: `${fieldName} = $${paramIndex + 1}`,
          params: [compExpr.value],
          nextParamIndex: paramIndex + 1
        };
    }
  } else if (expr.type === 'logical') {
    const logExpr = expr as LogicalExpression;
    // Handle logical expressions
    if (logExpr.expressions.length === 0) {
      return { sql: '1=1', params: [], nextParamIndex: paramIndex };
    }
    
    let currentParamIndex = paramIndex;
    const parts: string[] = [];
    const allParams: any[] = [];
    
    for (const subExpr of logExpr.expressions) {
      const { sql, params, nextParamIndex } = expressionToSQL(subExpr, fields, currentParamIndex);
      parts.push(sql);
      allParams.push(...params);
      currentParamIndex = nextParamIndex;
    }
    
    let joinedParts = '';
    
    if (logExpr.operator === 'not' && parts.length === 1) {
      joinedParts = `NOT (${parts[0]})`;
    } else {
      joinedParts = parts.join(` ${logExpr.operator.toUpperCase()} `);
    }
    
    // Add parentheses if this is a nested expression with multiple parts
    const finalSql = parts.length > 1 ? `(${joinedParts})` : joinedParts;
    
    return {
      sql: finalSql,
      params: allParams,
      nextParamIndex: currentParamIndex
    };
  }
  
  // This should never happen if the type system is working correctly
  return { sql: '1=1', params: [], nextParamIndex: paramIndex };
}

/**
 * Get a list of all field IDs used in a query expression
 */
export function getAllFields(expr: QueryExpression): string[] {
  if (expr.type === 'comparison') {
    const compExpr = expr as ComparisonExpression;
    return [compExpr.field];
  } else if (expr.type === 'logical') {
    const logExpr = expr as LogicalExpression;
    return logExpr.expressions.flatMap(e => getAllFields(e));
  }
  
  return [];
}

/**
 * Get available operators for a field type
 */
export function getOperatorsForType(fieldType: FieldType): ComparisonOperator[] {
  switch (fieldType) {
    case 'string':
      return [
        'equals', 'not_equals', 'contains', 'not_contains', 
        'starts_with', 'ends_with', 'in', 'not_in', 
        'is_null', 'is_not_null'
      ];
    case 'number':
      return [
        'equals', 'not_equals', 'greater_than', 'less_than', 
        'greater_than_equals', 'less_than_equals', 'in', 'not_in',
        'is_null', 'is_not_null'
      ];
    case 'boolean':
      return ['equals', 'not_equals', 'is_null', 'is_not_null'];
    case 'date':
      return [
        'equals', 'not_equals', 'greater_than', 'less_than', 
        'greater_than_equals', 'less_than_equals', 'is_null', 'is_not_null'
      ];
    case 'array':
      return ['contains', 'not_contains', 'is_null', 'is_not_null'];
    default:
      return ['equals', 'not_equals', 'is_null', 'is_not_null'];
  }
}

/**
 * Create a default query expression
 */
export function createDefaultExpression(): LogicalExpression {
  return {
    type: 'logical',
    operator: 'and',
    expressions: []
  };
}

/**
 * Create a default comparison expression
 */
export function createDefaultComparison(field: QueryField): ComparisonExpression {
  return {
    type: 'comparison',
    field: field.id,
    operator: getOperatorsForType(field.type)[0],
    value: null,
    fieldType: field.type
  };
}

/**
 * Validates a query expression for completeness and correctness
 */
export function validateExpression(expr: QueryExpression, fields: QueryField[]): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  if (expr.type === 'comparison') {
    const compExpr = expr as ComparisonExpression;
    const field = fields.find(f => f.id === compExpr.field);
    
    if (!field) {
      errors.push(`Unknown field: ${compExpr.field}`);
    }
    
    if (compExpr.value === null && !['is_null', 'is_not_null'].includes(compExpr.operator)) {
      errors.push('Value is required for this operator');
    }
    
    // Check type-specific validations
    if (field && compExpr.value !== null) {
      switch (field.type) {
        case 'number':
          if (typeof compExpr.value !== 'number') {
            errors.push('A numeric value is required');
          }
          break;
        case 'boolean':
          if (typeof compExpr.value !== 'boolean' && compExpr.value !== null) {
            errors.push('A boolean value is required');
          }
          break;
      }
    }
  } else if (expr.type === 'logical') {
    const logExpr = expr as LogicalExpression;
    if (logExpr.expressions.length === 0) {
      errors.push('At least one expression is required');
    }
    
    // Validate all child expressions
    for (const subExpr of logExpr.expressions) {
      const validation = validateExpression(subExpr, fields);
      errors.push(...validation.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Builds an initial expression from the FilterState for backward compatibility
 */
export function buildExpressionFromFilterState(filterState: {
  conditions: string[],
  medications: string[],
  specialties: string[],
  geographicAreas: string[],
  useAndLogic: boolean
}): LogicalExpression {
  const rootOperator: LogicalOperator = filterState.useAndLogic ? 'and' : 'or';
  
  // Create the root expression
  const rootExpression: LogicalExpression = {
    type: 'logical',
    operator: rootOperator,
    expressions: []
  };
  
  // Add conditions
  if (filterState.conditions.length > 0) {
    if (filterState.conditions.length === 1) {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'condition_id',
        operator: 'equals',
        value: filterState.conditions[0],
        fieldType: 'string'
      });
    } else {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'condition_id',
        operator: 'in',
        value: filterState.conditions,
        fieldType: 'string'
      });
    }
  }
  
  // Add medications
  if (filterState.medications.length > 0) {
    if (filterState.medications.length === 1) {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'medication_id',
        operator: 'equals',
        value: filterState.medications[0],
        fieldType: 'string'
      });
    } else {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'medication_id',
        operator: 'in',
        value: filterState.medications,
        fieldType: 'string'
      });
    }
  }
  
  // Add specialties
  if (filterState.specialties.length > 0) {
    if (filterState.specialties.length === 1) {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'specialty',
        operator: 'equals',
        value: filterState.specialties[0],
        fieldType: 'string'
      });
    } else {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'specialty',
        operator: 'in',
        value: filterState.specialties,
        fieldType: 'string'
      });
    }
  }
  
  // Add geographic areas
  if (filterState.geographicAreas.length > 0) {
    if (filterState.geographicAreas.length === 1) {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'geographic_area',
        operator: 'equals',
        value: filterState.geographicAreas[0],
        fieldType: 'string'
      });
    } else {
      rootExpression.expressions.push({
        type: 'comparison',
        field: 'geographic_area',
        operator: 'in',
        value: filterState.geographicAreas,
        fieldType: 'string'
      });
    }
  }
  
  return rootExpression;
}

// Re-export everything from queryBuilder.ts to ensure compatibility with existing code
export * from './queryBuilder';
