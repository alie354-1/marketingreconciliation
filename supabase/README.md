# Supabase Migrations

This directory contains SQL migrations for the database schema.

## Recent Migrations

### 20250328183700_fix_campaign_schema.sql

This migration fixes campaign creation issues by:

1. Removing the `creative_content` column from the campaigns table
2. Making `target_geographic_area` and `target_specialty` fields optional
3. Adding a new `targeting_metadata` JSONB column to store additional targeting information

## How to Apply Migrations

To apply new migrations to your Supabase database, you have several options:

### Option 1: Using the Supabase CLI

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push the migrations
supabase db push
```

### Option 2: Apply the SQL directly in the Supabase Dashboard

1. Log in to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the SQL migration file
4. Paste into the SQL Editor and run the query

### Option 3: Run the SQL from your application

Run the SQL file content through the `execute_sql` RPC function from your application code:

```typescript
const { error } = await supabase.rpc('execute_sql', {
  query: "/* SQL Migration Content Here */"
});
```

## Important Notes

- Always back up your database before applying migrations
- Test migrations in a development environment first
- If you encounter errors, check for:
  - Table or column conflicts
  - Missing references
  - Permission issues
