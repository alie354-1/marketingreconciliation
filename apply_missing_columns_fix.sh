#!/bin/bash

# Script to apply the missing columns fix
# This will run the migration and restart the application

echo "Applying missing columns fix..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root directory"
  exit 1
fi

# Run the migrations
echo "Running migrations to add missing columns and fix campaign results..."
echo "1. Running migration 20250330990000_add_missing_columns_for_campaign_results.sql"
npx supabase migration up 20250330990000_add_missing_columns_for_campaign_results.sql --db-url $DATABASE_URL

if [ $? -ne 0 ]; then
  echo "Error: Failed to run first migration. Please check your database connection."
  exit 1
fi

echo "2. Running migration 20250330995000_fix_campaign_results_expansion.sql"
npx supabase migration up 20250330995000_fix_campaign_results_expansion.sql --db-url $DATABASE_URL

if [ $? -ne 0 ]; then
  echo "Error: Failed to run second migration. Please check your database connection."
  exit 1
fi

echo "Migrations completed successfully."

# Restart the development server if it's running
if pgrep -f "vite" > /dev/null; then
  echo "Restarting development server..."
  pkill -f "vite"
  npm run dev &
  echo "Development server restarted."
else
  echo "Development server not running. Starting it now..."
  npm run dev &
  echo "Development server started."
fi

echo "Fix applied successfully!"
echo "You should now be able to access the ExploreDatabase component and Campaign Results without errors."
echo "The campaign results expansion should now display data properly when clicking on 'Full Results'."
echo "Note: Adding more medications will now increase the provider count rather than decrease it."
