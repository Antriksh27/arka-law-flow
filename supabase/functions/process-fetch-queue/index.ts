import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueItem {
  id: string;
  case_id: string;
  firm_id: string;
  cnr_number: string;
  court_type: string;
  status: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  last_error?: string;
  batch_id?: string;
  metadata?: any;
}

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ queue_id: string; error: string }>;
}

const mapCourtTypeToSearchType = (courtType: string): string => {
  const courtLower = courtType.toLowerCase();
  if (courtLower.includes("high")) return "high_court";
  if (courtLower.includes("district")) return "district_court";
  if (courtLower.includes("supreme")) return "supreme_court";
  return "high_court";
};

const calculateRetryDelay = (retryCount: number): number => {
  // Exponential backoff: 1min, 5min, 15min, 1hr
  const delays = [60, 300, 900, 3600];
  return delays[Math.min(retryCount, delays.length - 1)];
};

const getErrorMessage = (error: any): string => {
  const errorMap: Record<string, string> = {
    'CNR_NOT_FOUND': 'CNR number not found in eCourts system',
    'INVALID_CNR_FORMAT': 'CNR format is invalid',
    'API_TIMEOUT': 'eCourts API timed out',
    'RATE_LIMIT': 'API rate limit reached',
    'NETWORK_ERROR': 'Network connection issue',
    'COURT_TYPE_MISMATCH': 'Court type doesn\'t match CNR format'
  };

  const errorStr = error?.message || JSON.stringify(error);
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorStr.includes(key) || errorStr.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }
  return errorStr || 'Unknown error occurred';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header to pass to legalkart-api
    const authHeader = req.headers.get('authorization');

    const { batch_size = 10, delay_ms = 1500 } = await req.json();

    console.log(`[Queue Processor] Starting batch processing (size: ${batch_size}, delay: ${delay_ms}ms)`);

    // Fetch queue items to process
    // Get queued items first
    const { data: queuedItems, error: queuedError } = await supabase
      .from('case_fetch_queue')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('queued_at', { ascending: true })
      .limit(batch_size);

    if (queuedError) {
      console.error('[Queue Processor] Error fetching queued items:', queuedError);
      throw queuedError;
    }

    let queueItems = queuedItems || [];

    // If we need more items, get retryable failed items
    if (queueItems.length < batch_size) {
      const { data: failedItems, error: failedError } = await supabase
        .from('case_fetch_queue')
        .select('*')
        .eq('status', 'failed')
        .lte('next_retry_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('queued_at', { ascending: true })
        .limit(batch_size - queueItems.length);

      if (failedError) {
        console.error('[Queue Processor] Error fetching failed items:', failedError);
      } else if (failedItems) {
        // Filter items where retry_count < max_retries
        const retryableItems = failedItems.filter(item => item.retry_count < item.max_retries);
        queueItems = [...queueItems, ...retryableItems];
      }
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('[Queue Processor] No items in queue to process');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No items to process',
          result: { processed: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Queue Processor] Processing ${queueItems.length} items`);

    const result: ProcessResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Process each item
    for (const item of queueItems as QueueItem[]) {
      const startTime = Date.now();

      try {
        console.log(`[Queue Processor] Processing queue item ${item.id} for case ${item.case_id}`);

        // Mark as processing
        await supabase
          .from('case_fetch_queue')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString() 
          })
          .eq('id', item.id);

        // Call legalkart API with authorization
        const searchType = mapCourtTypeToSearchType(item.court_type);
        
        const { data: apiResponse, error: apiError } = await supabase.functions.invoke('legalkart-api', {
          headers: authHeader ? { authorization: authHeader } : {},
          body: {
            action: 'search',
            cnr: item.cnr_number,
            searchType,
            caseId: item.case_id,
            firmId: item.firm_id
          }
        });

        const processingDuration = Date.now() - startTime;

        // Check response
        if (apiError || apiResponse?.status === 'failed' || apiResponse?.error) {
          throw new Error(apiResponse?.error || apiResponse?.message || apiError?.message || 'API call failed');
        }

        // Success - mark as completed
        await supabase
          .from('case_fetch_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Update legalkart_case_searches with queue tracking
        await supabase
          .from('legalkart_case_searches')
          .update({
            retry_attempt: item.retry_count,
            processing_duration_ms: processingDuration,
            queue_item_id: item.id
          })
          .eq('case_id', item.case_id)
          .order('created_at', { ascending: false })
          .limit(1);

        result.succeeded++;
        console.log(`[Queue Processor] ✓ Successfully processed ${item.id}`);

      } catch (error: any) {
        console.error(`[Queue Processor] ✗ Failed to process ${item.id}:`, error);

        const friendlyError = getErrorMessage(error);
        const newRetryCount = item.retry_count + 1;
        const maxRetriesReached = newRetryCount >= item.max_retries;

        // Calculate next retry time
        const retryDelaySeconds = calculateRetryDelay(newRetryCount);
        const nextRetryAt = new Date(Date.now() + retryDelaySeconds * 1000).toISOString();

        // Update queue item
        await supabase
          .from('case_fetch_queue')
          .update({
            status: maxRetriesReached ? 'failed' : 'failed',
            retry_count: newRetryCount,
            last_error: friendlyError,
            last_error_at: new Date().toISOString(),
            next_retry_at: maxRetriesReached ? null : nextRetryAt
          })
          .eq('id', item.id);

        result.failed++;
        result.errors.push({
          queue_id: item.id,
          error: friendlyError
        });
      }

      result.processed++;

      // Delay between requests to avoid rate limiting
      if (result.processed < queueItems.length) {
        await new Promise(resolve => setTimeout(resolve, delay_ms));
      }
    }

    console.log(`[Queue Processor] Batch complete: ${result.succeeded} succeeded, ${result.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${result.processed} items: ${result.succeeded} succeeded, ${result.failed} failed`,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Queue Processor] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});