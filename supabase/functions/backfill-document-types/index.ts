// Backfill document types from webdav_path/file_url
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch documents that need backfilling
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, webdav_path, file_url, primary_document_type, sub_document_type')
      .or('primary_document_type.is.null,sub_document_type.is.null')

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${documents?.length || 0} documents to process`)

    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const doc of documents || []) {
      try {
        // Use webdav_path or file_url
        const path = doc.webdav_path || doc.file_url
        
        if (!path || typeof path !== 'string') {
          skippedCount++
          continue
        }

        // Path format: Clients/{client}/Cases/{case}/{primary}/{sub}/{file}
        const parts = path.split('/')
        const casesIdx = parts.indexOf('Cases')
        
        if (casesIdx < 0 || casesIdx + 3 >= parts.length) {
          // Try alternate format without "Cases" folder
          // Format could be: Clients/{client}/{case}/{primary}/{sub}/{file}
          const clientsIdx = parts.indexOf('Clients')
          if (clientsIdx >= 0 && clientsIdx + 4 < parts.length) {
            const inferredPrimary = parts[clientsIdx + 3]?.replace(/_/g, ' ')
            const inferredSub = parts[clientsIdx + 4]?.replace(/_/g, ' ')
            
            if (inferredPrimary || inferredSub) {
              const updateData: Record<string, string> = {}
              if (!doc.primary_document_type && inferredPrimary) {
                updateData.primary_document_type = inferredPrimary
              }
              if (!doc.sub_document_type && inferredSub) {
                updateData.sub_document_type = inferredSub
              }

              if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                  .from('documents')
                  .update(updateData)
                  .eq('id', doc.id)

                if (updateError) {
                  errors.push(`Doc ${doc.id}: ${updateError.message}`)
                } else {
                  updatedCount++
                }
              } else {
                skippedCount++
              }
            } else {
              skippedCount++
            }
          } else {
            skippedCount++
          }
          continue
        }

        // Standard format: Clients/{client}/Cases/{case}/{primary}/{sub}/{file}
        const inferredPrimary = parts[casesIdx + 2]?.replace(/_/g, ' ')
        const inferredSub = parts[casesIdx + 3]?.replace(/_/g, ' ')

        const updateData: Record<string, string> = {}
        if (!doc.primary_document_type && inferredPrimary) {
          updateData.primary_document_type = inferredPrimary
        }
        if (!doc.sub_document_type && inferredSub) {
          updateData.sub_document_type = inferredSub
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('documents')
            .update(updateData)
            .eq('id', doc.id)

          if (updateError) {
            errors.push(`Doc ${doc.id}: ${updateError.message}`)
          } else {
            updatedCount++
          }
        } else {
          skippedCount++
        }
      } catch (docError) {
        const errMsg = docError instanceof Error ? docError.message : String(docError)
        errors.push(`Doc ${doc.id}: ${errMsg}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backfill complete',
        stats: {
          total: documents?.length || 0,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errors.length
        },
        errors: errors.slice(0, 10) // Only return first 10 errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Backfill error:', errorMessage)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})