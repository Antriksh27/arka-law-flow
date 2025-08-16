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

    const { publicAppointmentId } = await req.json()

    if (!publicAppointmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing publicAppointmentId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the public appointment
    const { data: publicAppointment, error: fetchError } = await supabaseClient
      .from('public_appointments')
      .select('*')
      .eq('id', publicAppointmentId)
      .single()

    if (fetchError || !publicAppointment) {
      return new Response(
        JSON.stringify({ error: 'Public appointment not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get lawyer's firm_id
    const { data: teamMember, error: teamError } = await supabaseClient
      .from('team_members')
      .select('firm_id')
      .eq('user_id', publicAppointment.lawyer_id)
      .single()

    if (teamError || !teamMember) {
      console.error('Error finding team member:', teamError)
      return new Response(
        JSON.stringify({ error: 'Could not find lawyer firm' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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
        console.error('Error creating client:', clientError)
        return new Response(
          JSON.stringify({ error: 'Failed to create client' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      clientId = newClient.id
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
        title: publicAppointment.case_title || publicAppointment.reason || 'Consultation',
        notes: publicAppointment.reason,
        type: 'consultation',
        status: 'upcoming',
        firm_id: teamMember.firm_id,
        is_visible_to_team: true
      })
      .select()
      .single()

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to create appointment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update public appointment status to processed
    await supabaseClient
      .from('public_appointments')
      .update({ status: 'processed' })
      .eq('id', publicAppointmentId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointmentId: appointment.id,
        clientId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in sync-public-appointment function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})