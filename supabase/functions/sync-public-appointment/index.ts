import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const syncAppointmentSchema = z.object({
  publicAppointmentId: z.string().uuid({ message: "Invalid appointment ID format" })
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse and validate input
    const body = await req.json()
    const validation = syncAppointmentSchema.safeParse(body)
    
    if (!validation.success) {
      console.error('Validation failed:', validation.error.flatten())
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { publicAppointmentId } = validation.data

    // Get the public appointment
    const { data: publicAppointment, error: fetchError } = await supabaseClient
      .from('public_appointments')
      .select('*')
      .eq('id', publicAppointmentId)
      .single()

    if (fetchError || !publicAppointment) {
      console.error('Public appointment not found:', publicAppointmentId)
      return new Response(
        JSON.stringify({ error: 'Public appointment not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check rate limit using the new database function
    const sourceIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient
      .rpc('check_public_appointment_rate_limit', {
        p_email: publicAppointment.client_email,
        p_ip: sourceIp
      })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
    }

    if (rateLimitOk === false) {
      console.warn('Rate limit exceeded for:', publicAppointment.client_email, sourceIp)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600 // 1 hour in seconds
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(publicAppointment.client_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize text inputs to prevent XSS
    const sanitize = (str: string | null): string => {
      if (!str) return ''
      return str.replace(/[<>'"]/g, '').trim().substring(0, 255)
    }

    const sanitizedName = sanitize(publicAppointment.client_name)
    const sanitizedPhone = sanitize(publicAppointment.client_phone)

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
      // Create new client with sanitized data
      const { data: newClient, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          full_name: sanitizedName,
          email: publicAppointment.client_email,
          phone: sanitizedPhone,
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