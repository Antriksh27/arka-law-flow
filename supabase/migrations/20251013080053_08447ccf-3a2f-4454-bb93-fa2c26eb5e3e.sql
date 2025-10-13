-- Create a secure function to cascade delete cases and all related records
create or replace function public.delete_cases_and_dependencies(p_case_ids uuid[])
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Authorization: ensure current user is admin in the firm(s) of all target cases
  select count(*) into v_count
  from public.cases c
  join public.team_members tm
    on tm.firm_id = c.firm_id
   and tm.user_id = auth.uid()
   and tm.role = 'admin'
  where c.id = any(p_case_ids);

  if v_count < coalesce(array_length(p_case_ids, 1), 0) then
    raise exception 'Not authorized to delete one or more selected cases';
  end if;

  -- Delete dependent rows in a safe order
  delete from public.case_relations where case_id = any(p_case_ids) or related_case_id = any(p_case_ids);
  delete from public.case_activities where case_id = any(p_case_ids);
  delete from public.case_contacts where case_id = any(p_case_ids);
  delete from public.case_documents where case_id = any(p_case_ids);
  delete from public.case_hearings  where case_id = any(p_case_ids);
  delete from public.case_notes     where case_id = any(p_case_ids);
  delete from public.case_objections where case_id = any(p_case_ids);
  delete from public.case_orders    where case_id = any(p_case_ids);
  delete from public.case_files     where case_id = any(p_case_ids);
  delete from public.appointments   where case_id = any(p_case_ids);

  -- Optionally delete from tables that may or may not exist (tasks, hearings)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tasks') then
    execute 'delete from public.tasks where case_id = any($1)' using p_case_ids;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'hearings') then
    execute 'delete from public.hearings where case_id = any($1)' using p_case_ids;
  end if;

  -- Delete generic documents linked to cases (table exists based on FK error)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'documents') then
    execute 'delete from public.documents where case_id = any($1)' using p_case_ids;
  end if;

  -- Finally delete the cases
  delete from public.cases where id = any(p_case_ids);

  return json_build_object('deleted_cases', coalesce(array_length(p_case_ids,1),0));
end;
$$;

-- Create a secure function to delete a single document (bypassing RLS but enforcing firm- and role-based checks)
create or replace function public.delete_document_secure(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  -- Allow if user uploaded the doc or is firm admin/lawyer/office_staff/receptionist/paralegal for the doc's firm
  select exists (
    select 1
    from public.documents d
    left join public.team_members tm on tm.firm_id = d.firm_id and tm.user_id = auth.uid()
    where d.id = p_document_id
      and (
        d.uploaded_by = auth.uid()
        or tm.role in ('admin','lawyer','office_staff','receptionist','paralegal')
      )
  ) into v_allowed;

  if not coalesce(v_allowed, false) then
    raise exception 'Not authorized to delete this document';
  end if;

  delete from public.documents where id = p_document_id;
end;
$$;