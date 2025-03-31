# Missing Columns Fix Documentation

## Issue

The application was encountering errors when trying to access certain columns that don't exist in the database:

1. Missing `name` column in the `medications` table:
   ```
   Error fetching medications: {code: '42703', details: null, hint: null, message: 'column medications.name does not exist'}
   ```

2. Missing `geographic_area` column in the `providers` table:
   ```
   Error fetching regions: {code: '42703', details: null, hint: null, message: 'column providers.geographic_area does not exist'}
   ```

These errors were occurring in the `enhancedProviderDataService.ts` file (lines 72 and 121) which is called from `ExploreDatabase.tsx` when loading reference data.

## Solution

We implemented a two-part solution:

### 1. Frontend Fix

We modified the `CampaignResults.tsx` component to handle sample campaigns properly. The component now:

- Checks if the campaign ID starts with 'camp-' to identify sample campaigns
- Uses the sample campaign data from `sampleCampaignData.ts` for sample campaigns
- Only attempts to fetch from the database for real campaigns

This allows users to view campaign details for sample campaigns without encountering database errors.

### 2. Database Fix (Pending)

We've prepared migration scripts to fix the database schema:

- `20250330990000_add_missing_columns_for_campaign_results.sql`: Adds the missing columns to the medications and providers tables
- `20250330995000_fix_campaign_results_expansion.sql`: Ensures the campaign_results table has the correct structure and data

These migrations would:
- Add a `name` column to the `medications` table
- Add a `geographic_area` column to the `providers` table
- Create and populate the `script_lift_data` table
- Ensure the `campaign_results` table has the necessary structure and sample data

However, these migrations require direct database access to run. The `apply_missing_columns_fix.sh` script is available to run these migrations, but it requires the `DATABASE_URL` environment variable to be set.

## Running the Database Fix

To apply the database fix, you need to:

1. Set the `DATABASE_URL` environment variable to your Supabase database URL
2. Run the `apply_missing_columns_fix.sh` script

```bash
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
./apply_missing_columns_fix.sh
```

Alternatively, you can run the migrations directly using the Supabase CLI:

```bash
npx supabase link --project-ref [YOUR-PROJECT-REF] --password [YOUR-DB-PASSWORD]
npx supabase migration up
```

## Current Status

The frontend fix has been implemented and deployed, allowing users to view sample campaign details. The database fix is ready to be applied when database access is available.
