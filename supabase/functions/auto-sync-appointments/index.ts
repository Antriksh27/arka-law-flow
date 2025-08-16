import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting auto-sync of pending appointments...')

    // Get all pending public appointments
    const { data: pendingAppointments, error: fetchError } = await supabaseClient
      .from('public_appointments')
      .select('*')
      .eq('status', 'pending')

    if (fetchError) {
      console.error('Error fetching pending appointments:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending appointments' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!pendingAppointments || pendingAppointments.length === 0) {
      console.log('No pending appointments to process')
      return new Response(
        JSON.stringify({ success: true, message: 'No pending appointments to process', processed: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${pendingAppointments.length} pending appointments to process`)

    let processed = 0
    let errors = []

    for (const publicAppointment of pendingAppointments) {
      try {
        console.log(`Processing appointment ${publicAppointment.id}...`)

        // Get lawyer's firm_id
        const { data: teamMember, error: teamError } = await supabaseClient
          .from('team_members')
          .select('firm_id')
          .eq('user_id', publicAppointment.lawyer_id)
          .single()

        if (teamError || !teamMember) {
          console.error(`Error finding team member for appointment ${publicAppointment.id}:`, teamError)
          errors.push(`Could not find lawyer firm for appointment ${publicAppointment.id}`)
          continue
        }

        // Check if client exists, if not create one
        let clientId = null
        const { data: existingClient } = await supabaseClient
          .from('clients')
          .select('id')
          .eq('email', publicAppointment.client_email)
          .eq('firm_id', teamMember.firm_id)
          .single()

        if (existingClient) {
          clientId = existingClient.id
          console.log(`Using existing client ${clientId} for appointment ${publicAppointment.id}`)
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabaseClient
            .from('clients')
            .insert({
              full_name: publicAppointment.client_name,
              email: publicAppointment.client_email,
              phone: publicAppointment.client_phone,
              firm_id: teamMember.firm_id,
              status: 'lead'
            })
            .select('id')
            .single()

          if (clientError) {
            console.error(`Error creating client for appointment ${publicAppointment.id}:`, clientError)
            errors.push(`Failed to create client for appointment ${publicAppointment.id}`)
            continue
          }
          clientId = newClient.id
          console.log(`Created new client ${clientId} for appointment ${publicAppointment.id}`)
        }

        // Create appointment in main appointments table
        const { data: appointment, error: appointmentError } = await supabaseClient
          .from('appointments')
          .insert({
            lawyer_id: publicAppointment.lawyer_id,
            client_id: clientId,
            appointment_date: publicAppointment.appointment_date,
            appointment_time: publicAppointment.appointment_time,
            duration_minutes: publicAppointment.duration_minutes,
            title: `Appointment with ${publicAppointment.client_name}`,
            notes: publicAppointment.reason,
            type: 'consultation',
            status: 'upcoming',
            firm_id: teamMember.firm_id,
            is_visible_to_team: true
          })
          .select()
          .single()

        if (appointmentError) {
          console.error(`Error creating appointment for ${publicAppointment.id}:`, appointmentError)
          errors.push(`Failed to create appointment for ${publicAppointment.id}`)
          continue
        }

        // Notify the lawyer about the new appointment
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            recipient_id: publicAppointment.lawyer_id,
            notification_type: 'appointment',
            title: 'New Appointment Scheduled',
            message: `New appointment scheduled with ${publicAppointment.client_name} on ${publicAppointment.appointment_date} at ${publicAppointment.appointment_time}`,
            reference_id: appointment.id,
            read: false
          })

        if (notificationError) {
          console.error(`Error creating notification for appointment ${appointment.id}:`, notificationError)
        }

        // Update public appointment status to processed
        await supabaseClient
          .from('public_appointments')
          .update({ status: 'processed' })
          .eq('id', publicAppointment.id)

        console.log(`Successfully processed appointment ${publicAppointment.id} -> ${appointment.id}`)
        processed++

      } catch (error) {
        console.error(`Error processing appointment ${publicAppointment.id}:`, error)
        errors.push(`Error processing appointment ${publicAppointment.id}: ${error.message}`)
      }
    }

    console.log(`Auto-sync completed. Processed: ${processed}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully processed ${processed} appointments${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in auto-sync-appointments function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})