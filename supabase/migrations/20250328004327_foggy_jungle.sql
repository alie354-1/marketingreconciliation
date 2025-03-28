/*
  # Add targeting logic to campaigns

  1. Changes
    - Add `targeting_logic` column to `campaigns` table with default value 'or'
    - Add check constraint to ensure valid values
    - Backfill existing rows with default value

  2. Notes
    - Default value set to 'or' for backward compatibility
    - Values restricted to 'and' or 'or' via check constraint
*/

-- Add targeting_logic column with default value
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS targeting_logic text NOT NULL DEFAULT 'or';

-- Add check constraint to ensure valid values
ALTER TABLE campaigns
ADD CONSTRAINT campaigns_targeting_logic_check 
CHECK (targeting_logic IN ('and', 'or'));