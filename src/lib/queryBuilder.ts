/**
 * Query Builder Helper Functions
 * Utilities for working with the query expression system
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
 * Type guard to determine if an expression is a ComparisonExpression
 */
export function isComparisonExpression(expr: QueryExpression): expr is ComparisonExpression {
  return expr.type === 'comparison';
}

/**
 * Type guard to determine if an expression is a LogicalExpression
 */
export function isLogicalExpression(expr: QueryExpression): expr is LogicalExpression {
  return expr.type === 'logical';
}

/**
 * Generates a human-readable string representation of a query expression
 */
export function expressionToString(expr: QueryExpression, fields: QueryField[]): string {
  if (isComparisonExpression(expr)) {
    const field = fields.find(f => f.id === expr.field);
    const fieldName = field?.label || expr.field;
    
    switch (expr.operator) {
      case 'equals':
        return `${fieldName} = ${formatValue(expr.value, expr.fieldType)}`;
      case 'not_equals':
        return `${fieldName} ≠ ${formatValue(expr.value, expr.fieldType)}`;
      case 'greater_than':
        return `${fieldName} > ${formatValue(expr.value, expr.fieldType)}`;
      case 'less_than':
        return `${fieldName} < ${formatValue(expr.value, expr.fieldType)}`;
      case 'greater_than_equals':
        return `${fieldName} ≥ ${formatValue(expr.value, expr.fieldType)}`;
      case 'less_than_equals':
        return `${fieldName} ≤ ${formatValue(expr.value, expr.fieldType)}`;
      case 'contains':
        return `${fieldName} contains ${formatValue(expr.value, expr.fieldType)}`;
      case 'not_contains':
        return `${fieldName} does not contain ${formatValue(expr.value, expr.fieldType)}`;
      case 'starts_with':
        return `${fieldName} starts with ${formatValue(expr.value, expr.fieldType)}`;
      case 'ends_with':
        return `${fieldName} ends with ${formatValue(expr.value, expr.fieldType)}`;
      case 'in':
        if (Array.isArray(expr.value)) {
          return `${fieldName} in (${(expr.value as any[]).map((v: any) => formatValue(v, expr.fieldType)).join(', ')})`;
        }
        return `${fieldName} in (${formatValue(expr.value, expr.fieldType)})`;
      case 'not_in':
        if (Array.isArray(expr.value)) {
          return `${fieldName} not in (${(expr.value as any[]).map((v: any) => formatValue(v, expr.fieldType)).join(', ')})`;
        }
        return `${fieldName} not in (${formatValue(expr.value, expr.fieldType)})`;
      case 'is_null':
        return `${fieldName} is null`;
      case 'is_not_null':
        return `${fieldName} is not null`;
      default:
        return `${fieldName} ${expr.operator} ${formatValue(expr.value, expr.fieldType)}`;
    }
  } else if (isLogicalExpression(expr)) {
    const parts = expr.expressions.map(e => expressionToString(e, fields));
    
    if (expr.operator === 'not' && parts.length === 1) {
      return `NOT (${parts[0]})`;
    }
    
    const joinedParts = parts.join(` ${expr.operator.toUpperCase()} `);
    
    // Add parentheses if this is a nested expression
    return parts.length > 1 ? `(${joinedParts})` : joinedParts;
  }
  
  // This should never happen if the type system is working correctly
  return '';
}

/**
 * Formats a value for display in the query string
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
 * Converts a query expression to an SQL WHERE clause
 */
export function expressionToSQL(expr: QueryExpression, fields: QueryField[], paramIndex = 0): { sql: string, params: any[], nextParamIndex: number } {
  if (isComparisonExpression(expr)) {
    const field = fields.find(f => f.id === expr.field);
    const fieldName = field?.name || expr.field;
    
    if (['is_null', 'is_not_null'].includes(expr.operator)) {
      return {
        sql: `${fieldName} ${expr.operator === 'is_null' ? 'IS NULL' : 'IS NOT NULL'}`,
        params: [],
        nextParamIndex: paramIndex
      };
    }
    
    switch (expr.operator) {
      case 'equals':
        return {
          sql: `${fieldName} = $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'not_equals':
        return {
          sql: `${fieldName} != $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'greater_than':
        return {
          sql: `${fieldName} > $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'less_than':
        return {
          sql: `${fieldName} < $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'greater_than_equals':
        return {
          sql: `${fieldName} >= $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'less_than_equals':
        return {
          sql: `${fieldName} <= $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'contains':
        return {
          sql: `${fieldName} LIKE $${paramIndex + 1}`,
          params: [`%${expr.value}%`],
          nextParamIndex: paramIndex + 1
        };
      case 'not_contains':
        return {
          sql: `${fieldName} NOT LIKE $${paramIndex + 1}`,
          params: [`%${expr.value}%`],
          nextParamIndex: paramIndex + 1
        };
      case 'starts_with':
        return {
          sql: `${fieldName} LIKE $${paramIndex + 1}`,
          params: [`${expr.value}%`],
          nextParamIndex: paramIndex + 1
        };
      case 'ends_with':
        return {
          sql: `${fieldName} LIKE $${paramIndex + 1}`,
          params: [`%${expr.value}`],
          nextParamIndex: paramIndex + 1
        };
      case 'in':
        if (Array.isArray(expr.value)) {
          const placeholders = (expr.value as any[]).map((_, i) => `$${paramIndex + 1 + i}`).join(', ');
          return {
            sql: `${fieldName} IN (${placeholders})`,
            params: [...expr.value],
            nextParamIndex: paramIndex + expr.value.length
          };
        }
        return {
          sql: `${fieldName} IN ($${paramIndex + 1})`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      case 'not_in':
        if (Array.isArray(expr.value)) {
          const placeholders = (expr.value as any[]).map((_, i) => `$${paramIndex + 1 + i}`).join(', ');
          return {
            sql: `${fieldName} NOT IN (${placeholders})`,
            params: [...expr.value],
            nextParamIndex: paramIndex + expr.value.length
          };
        }
        return {
          sql: `${fieldName} NOT IN ($${paramIndex + 1})`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
      default:
        return {
          sql: `${fieldName} = $${paramIndex + 1}`,
          params: [expr.value],
          nextParamIndex: paramIndex + 1
        };
    }
  } else if (isLogicalExpression(expr)) {
    // Handle logical expressions
    if (expr.expressions.length === 0) {
      return { sql: '1=1', params: [], nextParamIndex: paramIndex };
    }
    
    let currentParamIndex = paramIndex;
    const parts: string[] = [];
    const allParams: any[] = [];
    
    for (const subExpr of expr.expressions) {
      const { sql, params, nextParamIndex } = expressionToSQL(subExpr, fields, currentParamIndex);
      parts.push(sql);
      allParams.push(...params);
      currentParamIndex = nextParamIndex;
    }
    
    let joinedParts = '';
    
    if (expr.operator === 'not' && parts.length === 1) {
      joinedParts = `NOT (${parts[0]})`;
    } else {
      joinedParts = parts.join(` ${expr.operator.toUpperCase()} `);
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
  if (isComparisonExpression(expr)) {
    return [expr.field];
  } else if (isLogicalExpression(expr)) {
    return expr.expressions.flatMap(e => getAllFields(e));
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
  
  if (isComparisonExpression(expr)) {
    const field = fields.find(f => f.id === expr.field);
    
    if (!field) {
      errors.push(`Unknown field: ${expr.field}`);
    }
    
    if (expr.value === null && !['is_null', 'is_not_null'].includes(expr.operator)) {
      errors.push('Value is required for this operator');
    }
    
    // Check type-specific validations
    if (field && expr.value !== null) {
      switch (field.type) {
        case 'number':
          if (typeof expr.value !== 'number') {
            errors.push('A numeric value is required');
          }
          break;
        case 'boolean':
          if (typeof expr.value !== 'boolean' && expr.value !== null) {
            errors.push('A boolean value is required');
          }
          break;
      }
    }
  } else if (isLogicalExpression(expr)) {
    if (expr.expressions.length === 0) {
      errors.push('At least one expression is required');
    }
    
    // Validate all child expressions
    for (const subExpr of expr.expressions) {
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
