-- Create notification trigger function
create or replace function handle_notification_trigger()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-knock',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'eventType', TG_OP,
        'record', row_to_json(NEW)
      )
    );
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

-- Appointments triggers
drop trigger if exists on_appointment_created on appointments;
create trigger on_appointment_created
after insert on appointments
for each row execute function handle_notification_trigger();

drop trigger if exists on_appointment_updated on appointments;
create trigger on_appointment_updated
after update on appointments
for each row execute function handle_notification_trigger();

-- Cases triggers
drop trigger if exists on_case_created on cases;
create trigger on_case_created
after insert on cases
for each row execute function handle_notification_trigger();

drop trigger if exists on_case_updated on cases;
create trigger on_case_updated
after update on cases
for each row execute function handle_notification_trigger();

-- Hearings triggers
drop trigger if exists on_hearing_created on hearings;
create trigger on_hearing_created
after insert on hearings
for each row execute function handle_notification_trigger();

drop trigger if exists on_hearing_updated on hearings;
create trigger on_hearing_updated
after update on hearings
for each row execute function handle_notification_trigger();

-- Tasks triggers
drop trigger if exists on_task_created on tasks;
create trigger on_task_created
after insert on tasks
for each row execute function handle_notification_trigger();

drop trigger if exists on_task_updated on tasks;
create trigger on_task_updated
after update on tasks
for each row execute function handle_notification_trigger();

-- Documents trigger
drop trigger if exists on_document_uploaded on documents;
create trigger on_document_uploaded
after insert on documents
for each row execute function handle_notification_trigger();

-- Messages trigger
drop trigger if exists on_message_created on messages;
create trigger on_message_created
after insert on messages
for each row execute function handle_notification_trigger();