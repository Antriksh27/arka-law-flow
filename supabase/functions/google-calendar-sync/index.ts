import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleCalendarSyncRequest {
  action: 'list_calendars' | 'sync_appointments' | 'auto_sync';
  access_token?: string;
  user_id?: string;
  settings?: any;
  appointment?: any;
  operation?: string;
}

interface GoogleCalendarEvent {
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email?: string
    displayName?: string
  }>
  location?: string
}

interface AppointmentData {
  id: string
  title: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  client_name?: string
  notes?: string
  lawyer_id: string
  status: string
  location?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, access_token, user_id, settings, appointment, operation }: GoogleCalendarSyncRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For auto_sync, we don't need auth header validation
    if (action === 'auto_sync') {
      console.log('Processing auto-sync request for user:', user_id)
      await processAutoSync(supabaseClient, user_id, appointment, operation);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Auto sync completed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get the current user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    if (action === 'list_calendars') {
      if (!access_token) {
        throw new Error('Google Calendar not connected. Please connect your calendar first.');
      }

      // Check if we have the required Google credentials
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        console.error('Missing Google OAuth credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
        throw new Error('Google OAuth credentials not configured. Please contact administrator.');
      }

      console.log('Fetching calendar list for user:', user.id);

      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Calendar list fetch failed:', response.status, errorData);
        
        if (response.status === 401) {
          throw new Error('Google Calendar access token expired. Please reconnect your calendar.');
        } else if (response.status === 403) {
          throw new Error('Access denied to Google Calendar. Please check your OAuth setup and permissions.');
        }
        
        throw new Error(`Failed to fetch calendar list: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const calendars = data.items.map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary,
        primary: calendar.primary,
      }));

      console.log('Retrieved calendars for user:', user.id, calendars.length);

      return new Response(
        JSON.stringify({ calendars }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'sync_appointments') {
      if (!settings || !user_id) {
        throw new Error('Settings and user_id are required for sync');
      }

      // Get user's appointments from the last 30 days and next 90 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const { data: appointments, error: appointmentsError } = await supabaseClient
        .from('appointments')
        .select('*')
        .eq('lawyer_id', user_id)
        .gte('appointment_date', startDate.toISOString().split('T')[0])
        .lte('appointment_date', endDate.toISOString().split('T')[0]);

      if (appointmentsError) {
        throw new Error('Failed to fetch appointments');
      }

      let syncedCount = 0;

      for (const appointment of appointments || []) {
        try {
          await syncAppointmentToGoogle(settings, appointment, 'INSERT');
          syncedCount++;
          console.log('Synced appointment:', appointment.id);
        } catch (error) {
          console.error('Error syncing individual appointment:', appointment.id, error.message);
        }
      }

      // Also process any pending queue items
      await processSyncQueue(supabaseClient, user_id);

      console.log('Sync completed for user:', user_id, 'Synced:', syncedCount, 'appointments');

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced_count: syncedCount,
          total_appointments: appointments?.length || 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Google Calendar sync error:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processAutoSync(supabaseClient: any, userId: string, appointment: AppointmentData, operation: string) {
  console.log('Processing auto sync for user:', userId, 'operation:', operation);

  // Get Google Calendar settings for the user
  const { data: googleSettings, error: settingsError } = await supabaseClient
    .from('google_calendar_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (settingsError || !googleSettings?.access_token) {
    console.log('No Google Calendar settings found for user:', userId);
    return;
  }

  if (!googleSettings.sync_enabled) {
    console.log('Google Calendar sync is disabled for user:', userId);
    return;
  }

  try {
    await syncAppointmentToGoogle(googleSettings, appointment, operation);
    console.log('Auto sync completed for appointment:', appointment.id);
  } catch (error) {
    console.error('Auto sync failed for appointment:', appointment.id, error.message);
  }
}

async function processSyncQueue(supabaseClient: any, userId: string) {
  // Get unprocessed items from the sync queue for this user
  const { data: queueItems, error } = await supabaseClient
    .from('google_calendar_sync_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error || !queueItems?.length) {
    return;
  }

  // Get Google Calendar settings
  const { data: googleSettings } = await supabaseClient
    .from('google_calendar_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!googleSettings?.access_token || !googleSettings.sync_enabled) {
    return;
  }

  for (const item of queueItems) {
    try {
      await syncAppointmentToGoogle(googleSettings, item.appointment_data, item.operation);

      // Mark as processed
      await supabaseClient
        .from('google_calendar_sync_queue')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', item.id);

    } catch (error) {
      console.error('Error processing sync queue item:', item.id, error);
      
      // Mark as processed with error
      await supabaseClient
        .from('google_calendar_sync_queue')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString(),
          error_message: error.message 
        })
        .eq('id', item.id);
    }
  }
}

async function syncAppointmentToGoogle(settings: any, appointment: AppointmentData, operation: string) {
  const calendarId = settings.calendar_id || 'primary';
  
  switch (operation) {
    case 'INSERT':
      await createGoogleCalendarEvent(settings.access_token, calendarId, appointment);
      break;
    case 'UPDATE':
      await updateGoogleCalendarEvent(settings.access_token, calendarId, appointment);
      break;
    case 'DELETE':
      await deleteGoogleCalendarEvent(settings.access_token, calendarId, appointment);
      break;
  }
}

async function createGoogleCalendarEvent(accessToken: string, calendarId: string, appointment: AppointmentData) {
  const event = buildGoogleCalendarEvent(appointment);
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create Google Calendar event:', error);
    throw new Error(`Failed to create Google Calendar event: ${error}`);
  }

  const createdEvent = await response.json();
  console.log('Created Google Calendar event:', createdEvent.id);
  return createdEvent;
}

async function updateGoogleCalendarEvent(accessToken: string, calendarId: string, appointment: AppointmentData) {
  // Search for existing event by title and date
  const event = buildGoogleCalendarEvent(appointment);
  
  const searchResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${encodeURIComponent(appointment.title)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (searchResponse.ok) {
    const searchResults = await searchResponse.json();
    const existingEvent = searchResults.items?.find((item: any) => 
      item.summary === appointment.title &&
      item.start?.dateTime?.includes(appointment.appointment_date)
    );

    if (existingEvent) {
      const updateResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${existingEvent.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        console.error('Failed to update Google Calendar event:', error);
        throw new Error(`Failed to update Google Calendar event: ${error}`);
      }

      console.log('Updated Google Calendar event:', existingEvent.id);
    } else {
      // If not found, create new event
      await createGoogleCalendarEvent(accessToken, calendarId, appointment);
    }
  }
}

async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, appointment: AppointmentData) {
  // Search for existing event by title and date
  const searchResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${encodeURIComponent(appointment.title)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (searchResponse.ok) {
    const searchResults = await searchResponse.json();
    const existingEvent = searchResults.items?.find((item: any) => 
      item.summary === appointment.title &&
      item.start?.dateTime?.includes(appointment.appointment_date)
    );

    if (existingEvent) {
      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${existingEvent.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.text();
        console.error('Failed to delete Google Calendar event:', error);
        throw new Error(`Failed to delete Google Calendar event: ${error}`);
      }

      console.log('Deleted Google Calendar event:', existingEvent.id);
    }
  }
}

function buildGoogleCalendarEvent(appointment: AppointmentData): GoogleCalendarEvent {
  // DEFINITIVE FIX: Google Calendar expects datetime in RFC3339 format
  // Since appointment times are stored as IST times, we need to treat them as such
  // Method: Use the date and time as-is and specify Asia/Kolkata timezone
  
  // Create the datetime in the format: YYYY-MM-DDTHH:mm:ss (no timezone, treated as local to specified timezone)
  const startDateTimeString = `${appointment.appointment_date}T${appointment.appointment_time}`;
  console.log('Raw datetime string:', startDateTimeString);
  
  const endTime = appointment.appointment_time.split(':');
  const endHour = parseInt(endTime[0]);
  const endMinute = parseInt(endTime[1]) + appointment.duration_minutes;
  const finalEndHour = endHour + Math.floor(endMinute / 60);
  const finalEndMinute = endMinute % 60;
  const endTimeString = `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}:00`;
  const endDateTimeString = `${appointment.appointment_date}T${endTimeString}`;

  const event = {
    summary: appointment.title || 'Appointment',
    description: `${appointment.notes || ''}\n\nClient: ${appointment.client_name || 'N/A'}\nStatus: ${appointment.status}`,
    start: {
      dateTime: startDateTimeString,
      timeZone: 'Asia/Kolkata'
    },
    end: {
      dateTime: endDateTimeString,
      timeZone: 'Asia/Kolkata'
    },
    location: appointment.location || '',
    attendees: appointment.client_name ? [{
      displayName: appointment.client_name
    }] : undefined
  };
  
  console.log('Sending to Google Calendar:', JSON.stringify(event.start, null, 2));
  return event;
}