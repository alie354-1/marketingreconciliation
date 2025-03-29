# Query Builder System

This folder contains a powerful, type-safe query building system for constructing and executing complex queries against your database.

## Components

### QueryBuilder

A React component that provides a visual interface for building complex queries with nested conditions. It supports various field types including string, number, boolean, and date, with appropriate operators for each type.

```tsx
import { QueryBuilder } from './components/query/QueryBuilder';
import { QueryField, QueryExpression } from './types/query';

// Define available fields
const fields: QueryField[] = [
  { 
    id: 'medication_id', 
    name: 'medications.id', 
    label: 'Medication',
    type: 'string',
    options: [
      { value: 'med-123', label: 'Advil' },
      { value: 'med-456', label: 'Tylenol' }
    ]
  },
  // More fields...
];

// State management
const [expression, setExpression] = useState(createDefaultExpression());
const [isValid, setIsValid] = useState(true);

// Usage
<QueryBuilder
  availableFields={fields}
  initialExpression={expression}
  onChange={setExpression}
  onValidationChange={setIsValid}
  showPreview={true}
/>
```

### SqlQueryBuilder

Extends the QueryBuilder with SQL generation, execution capabilities, and result visualization. It can connect to your Supabase backend to run queries directly.

```tsx
import { SqlQueryBuilder } from './components/query/SqlQueryBuilder';

<SqlQueryBuilder
  availableFields={fields}
  initialExpression={expression}
  onSaveQuery={handleSaveQuery}
  defaultLimit={100}
  maxResults={1000}
  allowExport={true}
/>
```

### QueryBuilderExample

A ready-to-use example component that demonstrates how to set up and use the QueryBuilder with sample fields.

```tsx
import { QueryBuilderExample } from './components/query/QueryBuilderExample';

<QueryBuilderExample />
```

## Core Libraries and Types

### queryBuilderV2.ts

A robust library of helper functions for working with query expressions:

- `createDefaultExpression()` - Creates an empty logical expression
- `createDefaultComparison(field)` - Creates a default comparison for a field
- `expressionToString(expr, fields)` - Converts an expression to a human-readable string
- `expressionToSQL(expr, fields)` - Converts an expression to SQL with parameterized values
- `validateExpression(expr, fields)` - Validates an expression for completeness and correctness
- `buildExpressionFromFilterState(filterState)` - Converts the legacy filter format to the new expression format

### types/query.ts

Contains all type definitions for the query builder system:

- `QueryField` - Defines a field that can be queried
- `QueryExpression` - Union type for all expressions
- `ComparisonExpression` - Represents a field-operator-value comparison
- `LogicalExpression` - Represents a logical grouping of expressions (AND, OR, NOT)
- `ComparisonOperator` - Available comparison operators
- `LogicalOperator` - Available logical operators
- `ValidationResult` - Result of expression validation

## Usage Examples

### Simple Condition

```tsx
// Create a condition: medication = 'Advil'
const condition: ComparisonExpression = {
  type: 'comparison',
  field: 'medication_id',
  operator: 'equals',
  value: 'med-123',
  fieldType: 'string'
};
```

### Complex Query

```tsx
// Create a complex query: (medication = 'Advil' OR condition = 'Headache') AND specialty = 'Neurology'
const query: LogicalExpression = {
  type: 'logical',
  operator: 'and',
  expressions: [
    {
      type: 'logical',
      operator: 'or',
      expressions: [
        {
          type: 'comparison',
          field: 'medication_id',
          operator: 'equals',
          value: 'med-123',
          fieldType: 'string'
        },
        {
          type: 'comparison',
          field: 'condition_id',
          operator: 'equals',
          value: 'cond-123',
          fieldType: 'string'
        }
      ]
    },
    {
      type: 'comparison',
      field: 'specialty',
      operator: 'equals',
      value: 'neurology',
      fieldType: 'string'
    }
  ]
};
```

### Converting to SQL

```tsx
const { sql, params } = expressionToSQL(query, fields);
console.log(sql); // "(medications.id = $1 OR conditions.id = $2) AND providers.specialty = $3"
console.log(params); // ["med-123", "cond-123", "neurology"]
```

## Extension Points

The query builder system is designed to be extensible:

1. Add new field types by extending the `FieldType` type and updating operator mappings
2. Create custom visualizations for specific query patterns
3. Extend the SQL generation to support different database dialects
4. Add custom validation rules for domain-specific requirements

## Integration with Existing System

The query builder system integrates seamlessly with the existing FilterState:

```tsx
// Convert from old format to new
const expression = buildExpressionFromFilterState(filterState);

// Store in FilterState
filterState.queryExpression = expression;
