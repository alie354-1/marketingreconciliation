# Unified Schema Fix for Marketing Reconciliation

This document outlines the unified database schema fixes implemented to resolve the two critical issues:
1. The "column prescriptions.campaign_id does not exist" error in Campaign Results
2. The 404 error when accessing creative templates

## Problem Details

### Issue 1: Prescription Table Schema Inconsistencies

The application had conflicting database schema definitions for the prescriptions table:

* **Original Schema (20250329100600_add_prescriptions_table.sql)** used:
  - `campaign_id` (UUID)
  - `provider_region` (TEXT)

* **Alternative Schema (20250330000300_prescriptions_no_dependencies.sql)** used:
  - `provider_geographic_area` (TEXT) instead of `provider_region`

This conflict caused errors when the application tried to access the `campaign_id` column that was missing in some environments.

### Issue 2: Creative Templates 404 Error

The application was trying to access the `creative_templates` endpoint, but received a 404 error because:
- The table didn't exist or wasn't properly created
- The route to access templates wasn't properly configured

## Solution: Unified Schema Migration

We created a single unified migration file (`20250331000000_unified_schema_fix.sql`) that:

1. **Reconciles prescription table schemas**:
   - Ensures `campaign_id` column exists and is properly typed as UUID
   - Maintains both `provider_region` and `provider_geographic_area` columns
   - Creates a trigger to keep both region fields in sync automatically
   - Sets up proper indexes for performance

2. **Ensures creative templates are available**:
   - Creates the `creative_templates` table if it doesn't exist
   - Adds all required columns with appropriate data types
   - Populates sample template data if none exists
   - Configures proper Row Level Security (RLS) policies

## How to Apply the Fix

To fix the issues:

1. Run the unified migration script:
   ```sql
   -- Execute the unified schema fix migration
   \i supabase/migrations/20250331000000_unified_schema_fix.sql
   ```

2. This single migration will handle both issues by:
   - Checking if the prescriptions table exists and fixing its schema
   - Checking if the creative_templates table exists and creating it if needed
   - Adding any missing columns to both tables
   - Maintaining backward compatibility with existing code

## Key Benefits

- **Non-destructive**: Preserves all existing data
- **Idempotent**: Can be run multiple times safely
- **Comprehensive**: Addresses both issues in one migration
- **Backward compatible**: Works with existing code without changes
- **Future-proof**: Adds proper constraints and triggers to prevent similar issues

## Verification

After running the migration, you should be able to:

1. View Campaign Results without the "column prescriptions.campaign_id does not exist" error
2. Access creative templates in both Campaign Creator and Audience Explorer without 404 errors

The script includes detailed logging that will show what changes were made during execution.
