-- Create a function to batch update case priorities efficiently
CREATE OR REPLACE FUNCTION batch_update_case_priority(target_priority TEXT, batch_size INT DEFAULT 1000)
RETURNS TABLE(updated_count BIGINT) AS $$
DECLARE
  total_updated BIGINT := 0;
  rows_affected INT;
BEGIN
  LOOP
    -- Update a batch of cases
    WITH batch AS (
      SELECT id 
      FROM cases 
      WHERE priority != target_priority 
      LIMIT batch_size
    )
    UPDATE cases 
    SET priority = target_priority,
        updated_at = NOW()
    FROM batch
    WHERE cases.id = batch.id;
    
    -- Get number of rows affected
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Exit if no more rows to update
    EXIT WHEN rows_affected = 0;
    
    -- Add to total
    total_updated := total_updated + rows_affected;
    
    -- Small delay to avoid overwhelming the database
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RETURN QUERY SELECT total_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;