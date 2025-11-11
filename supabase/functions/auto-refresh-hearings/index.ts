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

function detectCourtType(cnr: string): 'high_court' | 'district_court' | 'supreme_court' {
  const normalized = cnr.toUpperCase().replace(/[-\s]/g, '');
  
  // Check if starts with "SCIN" -> Supreme Court
  if (normalized.startsWith('SCIN')) {
    return 'supreme_court';
  }
  
  // Check if 3rd and 4th characters are "HC" -> High Court
  if (normalized.length >= 4 && normalized.substring(2, 4) === 'HC') {
    return 'high_court';
  }
  
  // Default to District Court
  return 'district_court';
}

function getTodayIST(): string {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
}

async function refreshCaseViaLegalkart(
  supabase: any,
  caseData: CaseToRefresh
): Promise<void> {
  const searchType = detectCourtType(caseData.cnr_number);
  
  console.log(`Refreshing case ${caseData.case_id} (${caseData.case_title}) with CNR: ${caseData.cnr_number}, type: ${searchType}`);
  
  // Call legalkart-api with upsert_from_json action instead of search
  // This avoids the user_id requirement issue
  const { error: caseError } = await supabase
    .from('cases')
    .select('fetched_data')
    .eq('id', caseData.case_id)
    .single();
    
  if (caseError) {
    throw new Error(`Failed to get case data: ${caseError.message}`);
  }
  
  // Call the legalkart-api to perform a fresh search
  const { data, error } = await supabase.functions.invoke('legalkart-api', {
    body: {
      action: 'search',
      cnr: caseData.cnr_number,
      searchType,
      caseId: caseData.case_id,
      firmId: caseData.firm_id,
      isSystemTriggered: true,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to refresh case');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'API returned unsuccessful response');
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  // Parse request body for custom date
  let targetDate = getTodayIST();
  try {
    const body = await req.json();
    if (body.date) {
      targetDate = body.date;
    }
  } catch {
    // Use default date if no body
  }

  console.log(`Auto-refresh triggered for date: ${targetDate}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query hearings scheduled for today (IST) from case_hearings table
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

    console.log(`Found ${hearings?.length || 0} hearings for today`);

    if (!hearings || hearings.length === 0) {
      const response = {
        success: true,
        date: targetDate,
        total_hearings: 0,
        cases_processed: 0,
        results: { success: [], failed: [], skipped: [] },
        execution_time_ms: Date.now() - startTime,
        message: 'No hearings scheduled for today',
      };

      // Log execution
      await supabase.from('auto_refresh_logs').insert({
        execution_date: targetDate,
        total_hearings: 0,
        cases_processed: 0,
        cases_succeeded: 0,
        cases_failed: 0,
        cases_skipped: 0,
        execution_duration_ms: response.execution_time_ms,
      });

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract unique cases from hearings
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
    console.log(`Processing ${casesToProcess.length} unique cases`);

    const results: RefreshResult = {
      success: [],
      failed: [],
      skipped: [],
    };

    // Process cases in batches with rate limiting
    const BATCH_SIZE = 5;
    const DELAY_MS = 1500;
    const MAX_CASES = 50;

    const limitedCases = casesToProcess.slice(0, MAX_CASES);

    for (let i = 0; i < limitedCases.length; i += BATCH_SIZE) {
      const batch = limitedCases.slice(i, i + BATCH_SIZE);

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
            results.success.push(result.value.case_id);
          } else {
            results.failed.push({
              case_id: result.value.case_id,
              error: result.value.error,
            });
          }
        } else {
          results.failed.push({
            case_id: 'unknown',
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Delay between batches
      if (i + BATCH_SIZE < limitedCases.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const executionTime = Date.now() - startTime;

    // Log execution to database
    await supabase.from('auto_refresh_logs').insert({
      execution_date: targetDate,
      total_hearings: hearings.length,
      cases_processed: results.success.length + results.failed.length,
      cases_succeeded: results.success.length,
      cases_failed: results.failed.length,
      cases_skipped: results.skipped.length,
      execution_duration_ms: executionTime,
      error_details: results.failed.length > 0 ? results.failed : null,
      success_details: results.success,
    });

    console.log(`Auto-refresh completed: ${results.success.length} succeeded, ${results.failed.length} failed`);

    const response = {
      success: true,
      date: targetDate,
      total_hearings: hearings.length,
      cases_processed: results.success.length + results.failed.length,
      results,
      execution_time_ms: executionTime,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Auto-refresh error:', error);

    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('auto_refresh_logs').insert({
        execution_date: targetDate,
        total_hearings: 0,
        cases_processed: 0,
        cases_succeeded: 0,
        cases_failed: 0,
        cases_skipped: 0,
        execution_duration_ms: Date.now() - startTime,
        error_details: [{ error: error.message }],
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        date: targetDate,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
