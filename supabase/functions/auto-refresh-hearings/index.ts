import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaseToRefresh {
  case_id: string;
  cnr_number: string;
  court_type: string | null;
  case_title: string;
  firm_id: string;
  hearing_count: number;
}

interface RefreshResult {
  success: string[];
  failed: Array<{ case_id: string; error: string }>;
  skipped: Array<{ case_id: string; reason: string }>;
}

// Configuration - optimized for reliability
const BATCH_SIZE = 2; // Reduced from 3 for better reliability
const DELAY_MS = 2000; // Delay between batches
const MAX_SUCCESSFUL = 35;
const FUNCTION_TIMEOUT_MS = 50000; // 50 seconds (edge functions have 60s limit)

function detectCourtType(cnr: string): 'high_court' | 'district_court' | 'supreme_court' {
  const normalized = cnr.toUpperCase().replace(/[-\s]/g, '');
  
  if (normalized.startsWith('SCIN')) {
    return 'supreme_court';
  }
  
  if (normalized.length >= 4 && normalized.substring(2, 4) === 'HC') {
    return 'high_court';
  }
  
  return 'district_court';
}

function getTodayIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
}

async function refreshCaseViaLegalkart(
  supabase: any,
  caseData: CaseToRefresh,
  timeoutMs: number = 25000
): Promise<void> {
  const searchType = detectCourtType(caseData.cnr_number);
  
  console.log(`🔄 Refreshing: ${caseData.case_title} (CNR: ${caseData.cnr_number}, type: ${searchType})`);
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout after 25s')), timeoutMs);
  });
  
  // Race between the actual request and timeout
  const fetchPromise = supabase.functions.invoke('legalkart-api', {
    body: {
      action: 'search',
      cnr: caseData.cnr_number,
      searchType,
      caseId: caseData.case_id,
      firmId: caseData.firm_id,
      isSystemTriggered: true,
    },
  });

  const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

  if (error) {
    throw new Error(error.message || 'Failed to refresh case');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'API returned unsuccessful response');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const functionStartedAt = new Date().toISOString();
  
  let targetDate = getTodayIST();
  try {
    const body = await req.json();
    if (body.date) {
      targetDate = body.date;
    }
  } catch {
    // Use default date if no body
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 AUTO-REFRESH STARTED at ${functionStartedAt}`);
  console.log(`📅 Target date: ${targetDate}`);
  console.log(`${'='.repeat(60)}\n`);

  // Initialize Supabase client early
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create initial "started" log entry immediately
  let logId: string | null = null;
  try {
    const { data: logData, error: logError } = await supabase
      .from('auto_refresh_logs')
      .insert({
        execution_date: targetDate,
        execution_time: functionStartedAt,
        total_hearings: 0,
        cases_processed: 0,
        cases_succeeded: 0,
        cases_failed: 0,
        cases_skipped: 0,
        execution_duration_ms: 0,
        error_details: [{ status: 'started', started_at: functionStartedAt }],
      })
      .select('id')
      .single();
    
    if (logData) {
      logId = logData.id;
      console.log(`📝 Created initial log entry: ${logId}`);
    }
    if (logError) {
      console.error('⚠️ Failed to create initial log:', logError.message);
    }
  } catch (e: any) {
    console.error('⚠️ Error creating initial log:', e.message);
  }

  // Helper to update log entry
  const updateLog = async (updates: any) => {
    if (!logId) return;
    try {
      await supabase
        .from('auto_refresh_logs')
        .update(updates)
        .eq('id', logId);
    } catch (e: any) {
      console.error('⚠️ Failed to update log:', e.message);
    }
  };

  try {
    // Query hearings scheduled for today
    console.log('📋 Querying hearings...');
    const { data: hearings, error: hearingsError } = await supabase
      .from('case_hearings')
      .select(`
        case_id,
        cases!inner(
          id,
          cnr_number,
          court_type,
          case_title,
          firm_id
        )
      `)
      .eq('hearing_date', targetDate)
      .not('cases.cnr_number', 'is', null)
      .neq('cases.cnr_number', '');

    if (hearingsError) {
      throw new Error(`Failed to query hearings: ${hearingsError.message}`);
    }

    console.log(`📊 Found ${hearings?.length || 0} hearings for ${targetDate}`);

    if (!hearings || hearings.length === 0) {
      const executionTime = Date.now() - startTime;
      
      await updateLog({
        total_hearings: 0,
        cases_processed: 0,
        cases_succeeded: 0,
        cases_failed: 0,
        cases_skipped: 0,
        execution_duration_ms: executionTime,
        error_details: null,
        success_details: { message: 'No hearings scheduled' },
      });

      console.log('✅ No hearings to process. Exiting.');
      
      return new Response(JSON.stringify({
        success: true,
        date: targetDate,
        total_hearings: 0,
        cases_processed: 0,
        results: { success: [], failed: [], skipped: [] },
        execution_time_ms: executionTime,
        message: 'No hearings scheduled for today',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract unique cases
    const uniqueCasesMap = new Map<string, CaseToRefresh>();
    hearings.forEach((h: any) => {
      const caseData = h.cases;
      if (caseData && caseData.cnr_number) {
        if (!uniqueCasesMap.has(caseData.id)) {
          uniqueCasesMap.set(caseData.id, {
            case_id: caseData.id,
            cnr_number: caseData.cnr_number,
            court_type: caseData.court_type,
            case_title: caseData.case_title,
            firm_id: caseData.firm_id,
            hearing_count: 1,
          });
        } else {
          const existing = uniqueCasesMap.get(caseData.id)!;
          existing.hearing_count++;
        }
      }
    });

    const casesToProcess = Array.from(uniqueCasesMap.values());
    console.log(`\n📦 Processing ${casesToProcess.length} unique cases (batch size: ${BATCH_SIZE}, delay: ${DELAY_MS}ms)\n`);

    // Update log with total hearings count
    await updateLog({
      total_hearings: hearings.length,
      error_details: [{ status: 'processing', unique_cases: casesToProcess.length }],
    });

    const results: RefreshResult = {
      success: [],
      failed: [],
      skipped: [],
    };

    let successfulFetches = 0;
    let timedOut = false;
    const limitedCases = casesToProcess.slice(0, 100);

    for (let i = 0; i < limitedCases.length; i += BATCH_SIZE) {
      // Check if we're approaching the function timeout
      const elapsedMs = Date.now() - startTime;
      if (elapsedMs > FUNCTION_TIMEOUT_MS) {
        console.log(`\n⏱️ TIMEOUT: Approaching function limit (${elapsedMs}ms elapsed). Saving progress...`);
        timedOut = true;
        
        // Mark remaining cases as skipped
        const remainingCases = limitedCases.slice(i);
        remainingCases.forEach(c => {
          results.skipped.push({
            case_id: c.case_id,
            reason: 'Function timeout - will retry next run',
          });
        });
        break;
      }

      const batch = limitedCases.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(limitedCases.length / BATCH_SIZE);
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} cases)`);

      const batchResults = await Promise.allSettled(
        batch.map(async (caseData) => {
          try {
            await refreshCaseViaLegalkart(supabase, caseData);
            return { success: true, case_id: caseData.case_id };
          } catch (error: any) {
            return {
              success: false,
              case_id: caseData.case_id,
              error: error.message,
            };
          }
        })
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successfulFetches++;
            results.success.push(result.value.case_id);
            console.log(`  ✅ Success: ${result.value.case_id}`);
          } else {
            results.failed.push({
              case_id: result.value.case_id,
              error: result.value.error,
            });
            console.log(`  ❌ Failed: ${result.value.case_id} - ${result.value.error}`);
          }
        } else {
          results.failed.push({
            case_id: 'unknown',
            error: result.reason?.message || 'Unknown error',
          });
          console.log(`  ❌ Error: ${result.reason?.message}`);
        }
      });

      // Log progress after each batch
      console.log(`  📊 Progress: ${results.success.length} succeeded, ${results.failed.length} failed`);

      // Stop if we reached the daily limit
      if (successfulFetches >= MAX_SUCCESSFUL) {
        console.log(`\n🎯 Reached daily limit of ${MAX_SUCCESSFUL} successful fetches.`);
        
        const remaining = limitedCases.length - (i + BATCH_SIZE);
        if (remaining > 0) {
          console.log(`⏭️ Skipping ${remaining} remaining cases`);
          results.skipped.push({
            case_id: 'batch',
            reason: `Daily limit of ${MAX_SUCCESSFUL} successful fetches reached`,
          });
        }
        break;
      }

      // Delay between batches (unless it's the last batch)
      if (i + BATCH_SIZE < limitedCases.length && !timedOut) {
        console.log(`  ⏳ Waiting ${DELAY_MS}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const executionTime = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   ✅ Succeeded: ${results.success.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log(`   ⏭️ Skipped: ${results.skipped.length}`);
    console.log(`   ⏱️ Duration: ${executionTime}ms`);
    console.log(`   ⏱️ Timed out: ${timedOut}`);
    console.log(`${'='.repeat(60)}\n`);

    // Queue failed AND skipped cases for retry
    const casesToQueue = [
      ...results.failed.map(f => f.case_id).filter(id => id && id !== 'unknown' && id !== 'batch'),
      ...results.skipped.map(s => s.case_id).filter(id => id && id !== 'unknown' && id !== 'batch'),
    ];
    
    if (casesToQueue.length > 0) {
      console.log(`\n⏰ Queueing ${casesToQueue.length} cases for retry (${results.failed.length} failed, ${results.skipped.length} skipped)...`);
      
      const { data: caseDetails } = await supabase
        .from('cases')
        .select('id, cnr_number, court_type, firm_id, created_by')
        .in('id', casesToQueue);
      
      if (caseDetails && caseDetails.length > 0) {
        const queueItems = caseDetails.map(c => ({
          case_id: c.id,
          cnr_number: c.cnr_number,
          court_type: c.court_type || detectCourtType(c.cnr_number),
          firm_id: c.firm_id,
          created_by: c.created_by,
          status: 'queued',
          priority: 8,
          next_retry_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          retry_count: 0,
          max_retries: 100,
          metadata: { source: 'auto-refresh-timeout', target_date: targetDate },
        }));
        
        const { error: queueError } = await supabase
          .from('case_fetch_queue')
          .upsert(queueItems, {
            onConflict: 'case_id',
            ignoreDuplicates: false,
          });
        
        if (queueError) {
          console.error('❌ Failed to queue retry items:', JSON.stringify(queueError));
        } else {
          console.log(`✅ Queued ${queueItems.length} cases for retry`);
        }
      }
    }

    // Update final log entry
    await updateLog({
      total_hearings: hearings.length,
      cases_processed: results.success.length + results.failed.length,
      cases_succeeded: results.success.length,
      cases_failed: results.failed.length,
      cases_skipped: results.skipped.length,
      execution_duration_ms: executionTime,
      error_details: results.failed.length > 0 ? results.failed : null,
      success_details: {
        case_ids: results.success,
        timed_out: timedOut,
        completed_at: new Date().toISOString(),
      },
    });

    console.log('✅ Auto-refresh completed successfully');

    return new Response(JSON.stringify({
      success: true,
      date: targetDate,
      total_hearings: hearings.length,
      cases_processed: results.success.length + results.failed.length,
      results,
      execution_time_ms: executionTime,
      timed_out: timedOut,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`\n❌ AUTO-REFRESH ERROR: ${error.message}`);
    console.error(`Stack: ${error.stack}`);

    // Update log with error
    await updateLog({
      cases_processed: 0,
      cases_succeeded: 0,
      cases_failed: 0,
      cases_skipped: 0,
      execution_duration_ms: executionTime,
      error_details: [{ 
        error: error.message, 
        stack: error.stack,
        failed_at: new Date().toISOString(),
      }],
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        date: targetDate,
        execution_time_ms: executionTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
