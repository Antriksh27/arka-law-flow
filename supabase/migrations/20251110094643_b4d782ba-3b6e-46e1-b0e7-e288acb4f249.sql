-- Phase 1: Add Critical Performance Indexes (Revised)
-- Expected Impact: 50-70% query time reduction on filtered queries

-- Cases table indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON public.cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_firm_status ON public.cases(firm_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_firm_assigned ON public.cases(firm_id, assigned_to);

-- Hearing-related indexes
CREATE INDEX IF NOT EXISTS idx_case_hearings_date ON public.case_hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_case_hearings_case_id ON public.case_hearings(case_id);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_case_status ON public.tasks(case_id, status);

-- Legalkart search optimization
CREATE INDEX IF NOT EXISTS idx_legalkart_searches_cnr ON public.legalkart_case_searches(cnr_number);

-- Appointments optimization
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer ON public.appointments(lawyer_id);

-- Clients optimization
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Documents optimization
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);

-- Activity logging indexes
CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON public.case_activities(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activities_created_at ON public.case_activities(created_at DESC);

-- Analyze tables after index creation to update statistics
ANALYZE public.cases;
ANALYZE public.case_hearings;
ANALYZE public.tasks;
ANALYZE public.appointments;
ANALYZE public.documents;
ANALYZE public.clients;