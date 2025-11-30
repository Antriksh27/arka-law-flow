import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured')
    }

    // Get audio data from request
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      throw new Error('No audio file provided')
    }

    console.log('Processing audio file:', audioFile.type, audioFile.size, 'bytes')

    const audioBuffer = await audioFile.arrayBuffer()

    // Call Deepgram API with smart formatting and punctuation
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/webm',
      },
      body: audioBuffer,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Deepgram API error:', errorText)
      throw new Error(`Deepgram API error: ${response.status}`)
    }

    const result = await response.json()
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''

    console.log('Transcription successful:', transcript.substring(0, 50) + '...')

    return new Response(
      JSON.stringify({ text: transcript, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Voice-to-text error:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
