-- Create a single-batch updater to avoid long-running transactions
CREATE OR REPLACE FUNCTION public.batch_update_case_priority_once(batch_size INT DEFAULT 200)
RETURNS INTEGER AS $$
DECLARE
  rows_affected INT := 0;
BEGIN
  WITH batch AS (
    SELECT id
    FROM public.cases
    WHERE priority IN ('low', 'high')
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.cases c
  SET priority = 'medium'::case_priority_enum,
      updated_at = now()
  FROM batch
  WHERE c.id = batch.id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';