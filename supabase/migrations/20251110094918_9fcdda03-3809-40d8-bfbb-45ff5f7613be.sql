-- Phase 3: Database Cleanup - Remove Redundant Tables
-- This migration removes tables that are duplicates or no longer used

-- Drop unused/redundant tables (backup data first if needed)
DROP TABLE IF EXISTS public.hearings CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.case_notes CASCADE;
DROP TABLE IF EXISTS public.court_hearings CASCADE;
DROP TABLE IF EXISTS public.case_files CASCADE;
DROP TABLE IF EXISTS public.case_emails CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.instructions CASCADE;
DROP TABLE IF EXISTS public.instruction_replies CASCADE;
DROP TABLE IF EXISTS public.thread_participants CASCADE;
DROP TABLE IF EXISTS public.message_threads CASCADE;
DROP TABLE IF EXISTS public.team_member_notes CASCADE;

-- Note: law_firm_members table is kept as it may have historical data
-- that hasn't been migrated to team_members yet

-- Analyze tables to update statistics
ANALYZE public.cases;
ANALYZE public.case_hearings;
ANALYZE public.documents;
ANALYZE public.clients;