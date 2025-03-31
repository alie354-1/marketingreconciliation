#!/bin/bash

# Script to run the fix_missing_columns.sql file
# This script will run the SQL file directly in the Supabase database

echo "Running fix_missing_columns.sql to add missing columns..."

# Check if the Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Installing now..."
    npm install -g supabase
fi

# Check if the user is logged in to Supabase
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "You need to log in to Supabase first."
    echo "Please run 'supabase login' and follow the instructions."
    exit 1
fi

# Get the Supabase project reference
echo "Please enter your Supabase project reference (found in your project settings):"
read -p "Project reference: " PROJECT_REF

# Get the database password
echo "Please enter your database password:"
read -s -p "Password: " DB_PASSWORD
echo ""

# Link the project
echo "Linking to Supabase project..."
supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"

if [ $? -ne 0 ]; then
    echo "Failed to link to Supabase project. Please check your project reference and password."
    exit 1
fi

# Run the SQL file
echo "Running SQL file to fix missing columns..."
supabase db execute --file fix_missing_columns.sql

if [ $? -ne 0 ]; then
    echo "Failed to run SQL file. Please check the error message above."
    exit 1
fi

echo "Fix applied successfully!"
echo "You should now be able to access the ExploreDatabase component and Campaign Results without errors."
