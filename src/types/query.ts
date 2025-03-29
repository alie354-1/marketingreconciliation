/**
 * Type definitions for the query builder
 */

// Basic field types
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

// Option for select fields
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Field definition for the query builder
export interface QueryField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  options?: SelectOption[];
  description?: string;
  table?: string;
  required?: boolean;
}

// Logical operators for combining expressions
export type LogicalOperator = 'and' | 'or' | 'not';

// Comparison operators for field comparisons
export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_equals'
  | 'less_than_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

// Base interface for all expressions
export interface BaseExpression {
  type: string;
}

// Comparison expression (field op value)
export interface ComparisonExpression extends BaseExpression {
  type: 'comparison';
  field: string;
  operator: ComparisonOperator;
  value: any;
  fieldType: FieldType;
}

// Logical expression (combines other expressions)
export interface LogicalExpression extends BaseExpression {
  type: 'logical';
  operator: LogicalOperator;
  expressions: QueryExpression[];
}

// Union type for all query expressions
export type QueryExpression = ComparisonExpression | LogicalExpression;

// Filter state for backward compatibility
export interface FilterState {
  conditions: string[];
  medications: string[];
  specialties: string[];
  geographicAreas: string[];
  useAndLogic: boolean;
}

// SQL query result
export interface SqlQueryResult {
  sql: string;
  params: any[];
  nextParamIndex: number;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
