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

# Run the migration
echo "Running migration to add missing columns..."
npx supabase migration up --db-url $DATABASE_URL

if [ $? -ne 0 ]; then
  echo "Error: Failed to run migration. Please check your database connection."
  exit 1
fi

echo "Migration completed successfully."

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
echo "Note: Adding more medications will now increase the provider count rather than decrease it."
