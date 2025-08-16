import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleCalendarSyncRequest {
  action: 'list_calendars' | 'sync_appointments';
  access_token?: string;
  user_id?: string;
  settings?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, access_token, user_id, settings }: GoogleCalendarSyncRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
        throw new Error('Access token is required');
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Calendar list fetch failed:', errorData);
        throw new Error('Failed to fetch calendar list');
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
          // Create event in Google Calendar
          const startDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
          const endDateTime = new Date(startDateTime.getTime() + (appointment.duration_minutes * 60000));

          const event = {
            summary: appointment.title || 'Appointment',
            description: appointment.notes || '',
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'UTC',
            },
            location: appointment.location || '',
          };

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${settings.calendar_id}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );

          if (response.ok) {
            syncedCount++;
            console.log('Synced appointment:', appointment.id);
          } else {
            console.error('Failed to sync appointment:', appointment.id, await response.text());
          }

        } catch (error) {
          console.error('Error syncing individual appointment:', appointment.id, error.message);
        }
      }

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