import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing Google Calendar sync queue...');

    // Get all unprocessed sync queue items
    const { data: queueItems, error } = await supabaseClient
      .from('google_calendar_sync_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching sync queue:', error);
      throw error;
    }

    if (!queueItems?.length) {
      console.log('No items in sync queue to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No items to process' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing ${queueItems.length} sync queue items`);

    // Group items by user_id to batch process per user
    const userGroups = queueItems.reduce((groups, item) => {
      if (!groups[item.user_id]) {
        groups[item.user_id] = [];
      }
      groups[item.user_id].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    let processedCount = 0;
    let errorCount = 0;

    // Process each user's items
    for (const [userId, items] of Object.entries(userGroups)) {
      try {
        // Get Google Calendar settings for this user
        const { data: googleSettings, error: settingsError } = await supabaseClient
          .from('google_calendar_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (settingsError || !googleSettings?.access_token || !googleSettings.sync_enabled) {
          console.log(`Skipping user ${userId}: No valid Google Calendar settings`);
          
          // Mark items as processed with error
          for (const item of items) {
            await supabaseClient
              .from('google_calendar_sync_queue')
              .update({ 
                processed: true, 
                processed_at: new Date().toISOString(),
                error_message: 'Google Calendar not configured or disabled'
              })
              .eq('id', item.id);
          }
          
          errorCount += items.length;
          continue;
        }

        // Process each item for this user
        for (const item of items) {
          try {
            await processQueueItem(googleSettings, item);
            
            // Mark as processed
            await supabaseClient
              .from('google_calendar_sync_queue')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', item.id);
            
            processedCount++;
            console.log(`Processed sync queue item: ${item.id}`);

          } catch (error) {
            console.error(`Error processing sync queue item ${item.id}:`, error);
            
            // Mark as processed with error
            await supabaseClient
              .from('google_calendar_sync_queue')
              .update({ 
                processed: true, 
                processed_at: new Date().toISOString(),
                error_message: error.message 
              })
              .eq('id', item.id);
            
            errorCount++;
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Error processing items for user ${userId}:`, error);
        
        // Mark all items for this user as processed with error
        for (const item of items) {
          await supabaseClient
            .from('google_calendar_sync_queue')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString(),
              error_message: `User processing error: ${error.message}`
            })
            .eq('id', item.id);
        }
        
        errorCount += items.length;
      }
    }

    console.log(`Google Calendar sync queue processing completed: ${processedCount} processed, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_count: processedCount,
        error_count: errorCount,
        total_items: queueItems.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Google Calendar sync queue processing error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processQueueItem(googleSettings: any, queueItem: any) {
  const appointment = queueItem.appointment_data;
  const operation = queueItem.operation;
  const calendarId = googleSettings.calendar_id || 'primary';

  console.log(`Processing ${operation} for appointment:`, appointment.id);

  switch (operation) {
    case 'INSERT':
      await createGoogleCalendarEvent(googleSettings.access_token, calendarId, appointment);
      break;
    case 'UPDATE':
      await updateGoogleCalendarEvent(googleSettings.access_token, calendarId, appointment);
      break;
    case 'DELETE':
      await deleteGoogleCalendarEvent(googleSettings.access_token, calendarId, appointment);
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function createGoogleCalendarEvent(accessToken: string, calendarId: string, appointment: any) {
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
    throw new Error(`Failed to create Google Calendar event: ${response.status} ${error}`);
  }

  const createdEvent = await response.json();
  console.log('Created Google Calendar event:', createdEvent.id);
  return createdEvent;
}

async function updateGoogleCalendarEvent(accessToken: string, calendarId: string, appointment: any) {
  const event = buildGoogleCalendarEvent(appointment);
  
  // Search for existing event by title and approximate date
  const searchResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${encodeURIComponent(appointment.title)}&timeMin=${appointment.appointment_date}T00:00:00Z&timeMax=${appointment.appointment_date}T23:59:59Z`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (searchResponse.ok) {
    const searchResults = await searchResponse.json();
    const existingEvent = searchResults.items?.find((item: any) => 
      item.summary === appointment.title
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
        throw new Error(`Failed to update Google Calendar event: ${updateResponse.status} ${error}`);
      }

      console.log('Updated Google Calendar event:', existingEvent.id);
    } else {
      // If not found, create new event
      await createGoogleCalendarEvent(accessToken, calendarId, appointment);
    }
  } else {
    // If search fails, try to create new event
    await createGoogleCalendarEvent(accessToken, calendarId, appointment);
  }
}

async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, appointment: any) {
  // Search for existing event by title and approximate date
  const searchResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${encodeURIComponent(appointment.title)}&timeMin=${appointment.appointment_date}T00:00:00Z&timeMax=${appointment.appointment_date}T23:59:59Z`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (searchResponse.ok) {
    const searchResults = await searchResponse.json();
    const existingEvent = searchResults.items?.find((item: any) => 
      item.summary === appointment.title
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
        throw new Error(`Failed to delete Google Calendar event: ${deleteResponse.status} ${error}`);
      }

      console.log('Deleted Google Calendar event:', existingEvent.id);
    } else {
      console.log('Event not found for deletion:', appointment.title);
    }
  }
}

function buildGoogleCalendarEvent(appointment: any) {
  const startDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const endDateTime = new Date(startDateTime.getTime() + (appointment.duration_minutes * 60000));

  return {
    summary: appointment.title || 'Appointment',
    description: `${appointment.notes || ''}\n\nClient: ${appointment.client_name || 'N/A'}\nStatus: ${appointment.status}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Asia/Kolkata'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Asia/Kolkata'
    },
    location: appointment.location || '',
    attendees: appointment.client_name ? [{
      displayName: appointment.client_name
    }] : undefined
  };
}