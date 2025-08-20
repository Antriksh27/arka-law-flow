import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleCalendarSettings {
  user_id: string;
  access_token: string;
  refresh_token?: string;
  calendar_id?: string;
  sync_enabled: boolean;
  token_expires_at?: string;
}

interface QueueItem {
  id: string;
  user_id: string;
  appointment_data: any;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  created_at: string;
  retry_count?: number;
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

        if (settingsError || !googleSettings?.sync_enabled) {
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

        // Check and refresh token if needed
        const validToken = await ensureValidAccessToken(supabaseClient, googleSettings);
        if (!validToken) {
          console.log(`Skipping user ${userId}: Invalid or expired access token`);
          
          // Mark items as processed with error
          for (const item of items) {
            await supabaseClient
              .from('google_calendar_sync_queue')
              .update({ 
                processed: true, 
                processed_at: new Date().toISOString(),
                error_message: 'Google Calendar access token expired or invalid'
              })
              .eq('id', item.id);
          }
          
          errorCount += items.length;
          continue;
        }

        // Process each item for this user with deduplication
        const processedAppointmentIds = new Set<string>();
        
        for (const item of items) {
          try {
            // Skip if we've already processed this appointment in this batch
            const appointmentKey = `${item.appointment_data.id}_${item.operation}`;
            if (processedAppointmentIds.has(appointmentKey)) {
              console.log(`Skipping duplicate item: ${item.id} for appointment ${item.appointment_data.id}`);
              
              // Mark as processed (duplicate)
              await supabaseClient
                .from('google_calendar_sync_queue')
                .update({ 
                  processed: true, 
                  processed_at: new Date().toISOString(),
                  error_message: 'Duplicate item skipped'
                })
                .eq('id', item.id);
              
              continue;
            }
            
            try {
              await processQueueItem(validToken, item);
            } catch (error) {
              // If token expired, try to refresh and retry once
              if (error.message.includes('Token expired') || error.message.includes('401')) {
                console.log(`Token expired error for user ${userId}, attempting refresh and retry`);
                const refreshedToken = await refreshAccessToken(supabaseClient, googleSettings);
                
                if (refreshedToken) {
                  console.log(`Retrying with refreshed token for user ${userId}`);
                  await processQueueItem(refreshedToken, item);
                } else {
                  throw new Error('Failed to refresh token after 401 error');
                }
              } else {
                throw error;
              }
            }
            
            // Mark as processed
            await supabaseClient
              .from('google_calendar_sync_queue')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', item.id);
            
            processedAppointmentIds.add(appointmentKey);
            processedCount++;
            console.log(`Processed sync queue item: ${item.id} for appointment ${item.appointment_data.id}`);

          } catch (error) {
            console.error(`Error processing sync queue item ${item.id}:`, error);
            
            // Check if it's a retryable error
            const retryCount = (item.retry_count || 0) + 1;
            const isRetryable = error.message.includes('rate limit') || error.message.includes('timeout');
            
            if (isRetryable && retryCount <= 3) {
              // Update retry count but don't mark as processed
              await supabaseClient
                .from('google_calendar_sync_queue')
                .update({ 
                  retry_count: retryCount,
                  error_message: `Retry ${retryCount}: ${error.message}`
                })
                .eq('id', item.id);
              
              console.log(`Will retry item ${item.id} (attempt ${retryCount})`);
            } else {
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
            
            errorCount++;
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));
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

async function ensureValidAccessToken(supabaseClient: any, settings: GoogleCalendarSettings): Promise<string | null> {
  try {
    // If no access token, return null
    if (!settings.access_token) {
      return null;
    }

    // Check if token is expired (if we have expiry info)
    if (settings.token_expires_at) {
      const expiryTime = new Date(settings.token_expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      
      if (now.getTime() > (expiryTime.getTime() - bufferTime)) {
        console.log(`Token expired for user ${settings.user_id}, attempting refresh`);
        
        if (settings.refresh_token) {
          const newToken = await refreshAccessToken(supabaseClient, settings);
          return newToken;
        } else {
          console.log(`No refresh token available for user ${settings.user_id}`);
          return null;
        }
      }
    } else {
      // If no expiration time is set, assume token might be old and set expiration to now
      // This will force a refresh if the token is actually expired
      console.log(`No expiration time for user ${settings.user_id}, setting to expired to force refresh check`);
      
      if (settings.refresh_token) {
        console.log(`Proactively refreshing token for user ${settings.user_id}`);
        const newToken = await refreshAccessToken(supabaseClient, settings);
        return newToken || settings.access_token;
      }
    }

    return settings.access_token;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return settings.access_token; // Return original token as fallback
  }
}

async function refreshAccessToken(supabaseClient: any, settings: GoogleCalendarSettings): Promise<string | null> {
  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials for token refresh');
      return null;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: settings.refresh_token!,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh failed:', errorData);
      return null;
    }

    const tokenData = await response.json();
    
    // Update the access token in the database
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    await supabaseClient
      .from('google_calendar_settings')
      .update({
        access_token: tokenData.access_token,
        token_expires_at: expiresAt.toISOString(),
        // Update refresh token if provided
        ...(tokenData.refresh_token && { refresh_token: tokenData.refresh_token })
      })
      .eq('user_id', settings.user_id);

    console.log(`Token refreshed successfully for user ${settings.user_id}`);
    return tokenData.access_token;
    
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

async function processQueueItem(accessToken: string, queueItem: QueueItem) {
  const appointment = queueItem.appointment_data;
  const operation = queueItem.operation;
  
  // Get calendar ID from the user's settings
  const calendarId = 'primary'; // Default to primary for now

  console.log(`Processing ${operation} for appointment:`, appointment.id);

  switch (operation) {
    case 'INSERT':
      await createGoogleCalendarEvent(accessToken, calendarId, appointment);
      break;
    case 'UPDATE':
      await updateGoogleCalendarEvent(accessToken, calendarId, appointment);
      break;
    case 'DELETE':
      await deleteGoogleCalendarEvent(accessToken, calendarId, appointment);
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
    
    // If it's a 401 error, the token might be expired even if we thought it was valid
    if (response.status === 401) {
      throw new Error(`Token expired: ${error}`);
    }
    
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

function getUserTimezone(): string {
  // For now, default to IST. In a real implementation, you'd get this from user settings
  return 'Asia/Kolkata';
}

function buildGoogleCalendarEvent(appointment: any) {
  const userTimezone = getUserTimezone();
  
  // Parse the appointment date and time properly
  const appointmentDate = appointment.appointment_date;
  const appointmentTime = appointment.appointment_time;
  
  // Create ISO datetime string in the user's timezone
  const startDateTime = `${appointmentDate}T${appointmentTime}`;
  
  // Calculate end time
  const startDate = new Date(`${appointmentDate}T${appointmentTime}`);
  const endDate = new Date(startDate.getTime() + (appointment.duration_minutes * 60000));
  
  // Format end time back to time string
  const endTimeString = endDate.toTimeString().substring(0, 8);
  const endDateTime = `${appointmentDate}T${endTimeString}`;

  console.log('Building Google Calendar event:');
  console.log('  Start:', startDateTime, 'Timezone:', userTimezone);
  console.log('  End:', endDateTime, 'Timezone:', userTimezone);
  console.log('  Duration:', appointment.duration_minutes, 'minutes');

  return {
    summary: appointment.title || 'Appointment',
    description: `${appointment.notes || ''}\n\nClient: ${appointment.client_name || 'N/A'}\nStatus: ${appointment.status}`,
    start: {
      dateTime: startDateTime,
      timeZone: userTimezone
    },
    end: {
      dateTime: endDateTime,
      timeZone: userTimezone
    },
    location: appointment.location || '',
    attendees: appointment.client_name ? [{
      displayName: appointment.client_name
    }] : undefined
  };
}