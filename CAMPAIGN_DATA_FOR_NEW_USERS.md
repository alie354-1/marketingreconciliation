# Automatic Campaign Data for New Users

This document explains how sample campaign data is now automatically copied for new users when they sign up or sign in to the application.

## Overview

When a new user signs up or signs in to the application, the system will automatically check if they have any campaign data associated with their account. If no campaigns exist for the user, the system will copy sample campaign data, including campaigns, campaign results, and prescription data, to the user's account.

## Implementation Details

### 1. Database Migration

A new database migration file has been created: `supabase/migrations/20250330010000_user_sample_data.sql`. This migration does two things:

1. **Adds a user_id column to the campaigns table**: This column associates campaign data with specific users.
2. **Creates a database function called copy_sample_data_for_new_user**: This function copies sample campaign data for a new user.

To run this migration:

```bash
# Using Supabase CLI
supabase db push

# Or directly in the Supabase dashboard SQL editor
\i supabase/migrations/20250330010000_user_sample_data.sql
```

### 2. Frontend Integration

The authentication logic in `src/store/slices/authSlice.ts` has been updated to call the sample data copy function at three key points:

1. When a user signs in
2. When a user signs up
3. When a user's session is resumed (via getCurrentUser)

The frontend performs these steps:

1. First checks if the user already has campaigns
2. If no campaigns exist, calls the database function to copy sample data
3. Logs the result of the operation

## How It Works

The database function `copy_sample_data_for_new_user`:

1. Takes a user_id parameter
2. Queries for existing sample campaigns
3. Creates copies of these campaigns with the new user_id
4. Also copies related campaign_results and prescriptions data
5. Only copies data if the user doesn't already have campaigns

The function is designed to be safe, idempotent (can be run multiple times without duplicating data), and efficient.

## Testing

You can test this functionality by:

1. Creating a new user account
2. Observing that campaigns appear in the dashboard automatically
3. Checking the browser console for logs confirming the sample data was copied

## Debugging

If issues occur, check:

1. Browser console for any error messages
2. Supabase logs for database function errors
3. Ensure the user has proper permissions to call the RPC function

## Data Security

The implementation follows best practices for data security:

1. Each user only sees their own campaigns via user_id filtering
2. The SQL function uses SECURITY DEFINER to ensure it runs with proper permissions
3. Database operations are wrapped in error handling to prevent crashes
