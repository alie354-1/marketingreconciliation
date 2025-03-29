-- Create a function to automatically update campaign statuses based on dates
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
DECLARE
  current_date TIMESTAMP := NOW();
BEGIN
  -- Skip if the campaign is in draft mode (don't auto-activate drafts)
  IF NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;
  
  -- Check date ranges and update status
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    -- Campaign has both start and end date
    IF current_date BETWEEN NEW.start_date AND NEW.end_date THEN
      NEW.status := 'active';
    ELSIF current_date > NEW.end_date THEN
      NEW.status := 'completed';
    END IF;
  ELSIF NEW.start_date IS NOT NULL AND NEW.end_date IS NULL THEN
    -- Campaign has only start date (indefinite end)
    IF current_date >= NEW.start_date THEN
      NEW.status := 'active';
    END IF;
  ELSIF NEW.start_date IS NULL AND NEW.end_date IS NOT NULL THEN
    -- Campaign has only end date (already running)
    IF current_date <= NEW.end_date THEN
      NEW.status := 'active';
    ELSE
      NEW.status := 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update campaign status on insert or update
DROP TRIGGER IF EXISTS campaign_auto_status_trigger ON campaigns;
CREATE TRIGGER campaign_auto_status_trigger
BEFORE INSERT OR UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaign_status();

-- Create a function to run daily to update all campaign statuses
CREATE OR REPLACE FUNCTION update_all_campaign_statuses()
RETURNS VOID AS $$
BEGIN
  -- Update all non-draft campaigns
  UPDATE campaigns
  SET updated_at = NOW() -- This will trigger the BEFORE UPDATE trigger
  WHERE status != 'draft';
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION update_all_campaign_statuses() IS 'Run this function daily to automatically update campaign statuses based on date ranges';

-- Create a scheduled task to run daily (this requires pg_cron extension, which is available in Supabase)
-- If pg_cron is not available, this can be run manually or via a cron job calling a Supabase Edge Function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- pg_cron is available, schedule a daily task
    SELECT cron.schedule('daily-campaign-status-update', '0 0 * * *', 'SELECT update_all_campaign_statuses()');
  END IF;
END $$;
