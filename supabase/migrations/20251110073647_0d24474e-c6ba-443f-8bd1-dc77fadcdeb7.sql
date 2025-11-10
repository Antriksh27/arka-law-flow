-- Add index to speed up order queries by case and hearing date
CREATE INDEX IF NOT EXISTS idx_case_orders_case_id_hearing_date
  ON public.case_orders (case_id, hearing_date);
