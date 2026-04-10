import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import {
  mapEcourtsCaseToCRM,
  extractHearings,
  extractOrders,
  extractDocuments,
  extractPetitioners,
  extractRespondents,
  extractIADetails,
  extractObjections,
  normalizeDate,
} from "./dataMapper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const ECOURTS_BASE = 'https://webapi.ecourtsindia.com';

// Input validation schemas
const cnrSchema = z.string().trim().min(4).max(50).transform(s => s.toUpperCase().replace(/[^A-Z0-9]/g, ''));

// Timeout-safe fetch
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function getApiKey(): string {
  const key = Deno.env.get('ECOURTS_API_KEY');
  if (!key) throw new Error('ECOURTS_API_KEY is not configured');
  return key;
}

function authHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// Map eCourtsIndia error codes to friendly messages
function mapErrorCode(code: string | undefined, message: string): string {
  const errorMap: Record<string, string> = {
    'INVALID_CNR': 'CNR format is invalid',
    'CASE_NOT_FOUND': 'Case not found in eCourts system',
    'INSUFFICIENT_CREDITS': 'API credits exhausted. Please recharge.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait and try again.',
    'TOKEN_EXPIRED': 'API token expired. Please update ECOURTS_API_KEY.',
    'INVALID_TOKEN': 'API token is invalid. Please check ECOURTS_API_KEY.',
    'ORDER_NOT_FOUND': 'Order document not found',
    'INTERNAL_ERROR': 'eCourts server error. Please try again later.',
  };
  return errorMap[code ?? ''] ?? message ?? 'Unknown error';
}

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (v?: string | null) => v ? UUID_REGEX.test(v) : false;

async function resolveSearchCreatedBy(supabase: any, firmId: string, preferredUserId?: string | null): Promise<string | null> {
  if (isValidUuid(preferredUserId)) {
    const { data } = await supabase.from('profiles').select('id').eq('id', preferredUserId).maybeSingle();
    if (data?.id) return data.id;
  }
  const { data: members } = await supabase
    .from('team_members').select('user_id').eq('firm_id', firmId)
    .in('role', ['admin', 'lawyer', 'office_staff']).limit(5);
  const ids = (members ?? []).map((m: any) => m.user_id).filter(isValidUuid);
  if (ids.length === 0) return null;
  const { data: profiles } = await supabase.from('profiles').select('id').in('id', ids);
  const profileSet = new Set((profiles ?? []).map((p: any) => p.id));
  return ids.find((id: string) => profileSet.has(id)) ?? null;
}

// ----- Upsert relational data from eCourtsIndia response -----
async function upsertCaseRelationalData(supabase: any, caseId: string, apiResponse: any) {
  console.log('📦 Upserting relational data for case:', caseId);

  // Delete existing data
  await Promise.all([
    supabase.from('petitioners').delete().eq('case_id', caseId),
    supabase.from('respondents').delete().eq('case_id', caseId),
    supabase.from('ia_details').delete().eq('case_id', caseId),
    supabase.from('case_documents').delete().eq('case_id', caseId),
    supabase.from('case_orders').delete().eq('case_id', caseId),
    supabase.from('case_hearings').delete().eq('case_id', caseId),
    supabase.from('case_objections').delete().eq('case_id', caseId),
  ]);

  const petitioners = extractPetitioners(apiResponse, caseId);
  const respondents = extractRespondents(apiResponse, caseId);
  const iaDetails = extractIADetails(apiResponse, caseId);
  const documents = extractDocuments(apiResponse, caseId);
  const orders = extractOrders(apiResponse, caseId);
  const hearings = extractHearings(apiResponse, caseId);
  const objections = extractObjections(apiResponse, caseId);

  const insertIfNotEmpty = async (table: string, rows: any[]) => {
    if (rows.length === 0) return;
    const { error } = await supabase.from(table).insert(rows);
    if (error) console.error(`Error inserting ${table}:`, error);
    else console.log(`✅ Inserted ${rows.length} ${table}`);
  };

  await Promise.all([
    insertIfNotEmpty('petitioners', petitioners),
    insertIfNotEmpty('respondents', respondents),
    insertIfNotEmpty('ia_details', iaDetails),
    insertIfNotEmpty('case_documents', documents),
    insertIfNotEmpty('case_orders', orders),
    insertIfNotEmpty('case_hearings', hearings),
    insertIfNotEmpty('case_objections', objections),
  ]);

  console.log('✅ Relational data upserted successfully');
  return { petitioners: petitioners.length, respondents: respondents.length, orders: orders.length, hearings: hearings.length };
}

// ----- Supreme Court data upsert (reuse existing logic - SC data comes through same API now) -----
async function upsertSupremeCourtData(supabase: any, caseId: string, firmId: string, apiResponse: any) {
  console.log('🏛️ Upserting Supreme Court data for case:', caseId);
  const data = apiResponse?.data ?? apiResponse ?? {};
  const cc = data.courtCaseData ?? {};

  // UPSERT legalkart_cases (we keep this table for backward compat)
  const legalkartUpsert: any = {
    case_id: caseId,
    firm_id: firmId,
    cnr_number: cc.cnr ?? null,
    case_title: cc.petitioners?.[0] && cc.respondents?.[0]
      ? `${cc.petitioners[0]} vs ${cc.respondents[0]}` : cc.caseNumber,
    case_number: cc.caseNumber ?? null,
    diary_number: cc.diaryNumber ?? null,
    bench_composition: cc.judges ?? null,
  };

  const { error: lcError } = await supabase.from('legalkart_cases').insert(legalkartUpsert)
    .select().single().then((result: any) =>
      result.error ? supabase.from('legalkart_cases').update(legalkartUpsert).eq('case_id', caseId) : result
    );
  if (lcError) console.error('Error updating legalkart_cases:', lcError);

  // Delete existing SC data
  await Promise.all([
    supabase.from('sc_earlier_court_details').delete().eq('case_id', caseId),
    supabase.from('sc_tagged_matters').delete().eq('case_id', caseId),
    supabase.from('sc_listing_dates').delete().eq('case_id', caseId),
    supabase.from('sc_notices').delete().eq('case_id', caseId),
    supabase.from('sc_defects').delete().eq('case_id', caseId),
    supabase.from('sc_judgement_orders').delete().eq('case_id', caseId),
    supabase.from('sc_office_reports').delete().eq('case_id', caseId),
    supabase.from('sc_similarities').delete().eq('case_id', caseId),
  ]);

  // Insert SC-specific arrays from courtCaseData
  const insertArr = async (table: string, arr: any[], mapper: (item: any) => any) => {
    if (!Array.isArray(arr) || arr.length === 0) return;
    const { error } = await supabase.from(table).insert(arr.map(mapper));
    if (error) console.error(`Error inserting ${table}:`, error);
  };

  await insertArr('sc_listing_dates', cc.listingDates ?? [], (ld: any) => ({
    case_id: caseId,
    cl_date: normalizeDate(ld.date ?? ld.clDate),
    misc_or_regular: ld.miscOrRegular ?? null,
    stage: ld.stage ?? null,
    purpose: ld.purpose ?? null,
    judges: ld.judges ? (Array.isArray(ld.judges) ? ld.judges : [ld.judges]) : [],
    remarks: ld.remarks ?? null,
    listed_status: ld.listed ?? null,
  }));

  await insertArr('sc_judgement_orders', cc.judgmentOrders ?? [], (o: any) => ({
    case_id: caseId,
    order_date: normalizeDate(o.orderDate ?? o.date),
    pdf_url: o.orderUrl ?? null,
    order_type: o.orderType ?? null,
  }));

  // Also upsert the standard relational data
  await upsertCaseRelationalData(supabase, caseId, apiResponse);

  console.log('✅ Supreme Court data upserted');
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const requestBody = await req.json();
    const { action } = requestBody;
    console.log(`📨 eCourtsIndia API - Action: ${action}`);

    // Auth: detect internal vs user call
    const authHeader = req.headers.get('Authorization') || '';
    const apikeyHeader = req.headers.get('apikey') || req.headers.get('x-api-key') || '';
    const isInternalCall = apikeyHeader === serviceRoleKey;

    let firmId: string;
    let userId: string;

    if (isInternalCall) {
      if (!requestBody.firmId) {
        return new Response(JSON.stringify({ success: false, error: 'firmId required for internal calls' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      firmId = requestBody.firmId;
      userId = requestBody.userId || 'system';
    } else {
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ success: false, error: 'Missing Authorization. Please sign in.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const jwt = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        userId = payload.sub;
        if (!userId) throw new Error('Missing sub claim');

        const { data: tm, error: tmError } = await supabase
          .from('team_members').select('firm_id, role').eq('user_id', userId).single();
        if (tmError || !tm) {
          return new Response(JSON.stringify({ success: false, error: 'User not authorized.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        firmId = tm.firm_id;
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ===== ACTION: case_detail =====
    if (action === 'case_detail' || action === 'search') {
      const { cnr, caseId, isSystemTriggered } = requestBody;
      const parsedCnr = cnrSchema.safeParse(cnr);
      if (!parsedCnr.success) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid CNR format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const normalizedCnr = parsedCnr.data;
      console.log(`🔍 Fetching case detail for CNR: ${normalizedCnr}`);

      // Create search record (skip for system-triggered)
      let searchRecord: any = null;
      if (!isSystemTriggered) {
        const createdBy = await resolveSearchCreatedBy(supabase, firmId, userId);
        if (createdBy) {
          const { data: sr, error: insertErr } = await supabase
            .from('legalkart_case_searches')
            .insert({
              firm_id: firmId,
              case_id: requestBody.caseId || null,
              cnr_number: normalizedCnr,
              search_type: 'district_court', // Generic — eCourtsIndia handles all courts
              request_data: { cnr: normalizedCnr, source: 'ecourts_india_v4' },
              created_by: createdBy,
            })
            .select().single();
          if (!insertErr) searchRecord = sr;
        }
      }

      // Call eCourtsIndia API
      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/case/${normalizedCnr}`,
        { method: 'GET', headers: authHeaders() },
        30000
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errCode = errBody?.error?.code;
        const errMsg = mapErrorCode(errCode, errBody?.error?.message ?? `HTTP ${response.status}`);
        console.error(`❌ eCourtsIndia API error: ${errMsg}`);

        if (searchRecord) {
          await supabase.from('legalkart_case_searches')
            .update({ status: 'failed', error_message: errMsg }).eq('id', searchRecord.id);
        }

        return new Response(JSON.stringify({ success: false, error: errMsg, data: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const apiData = await response.json();
      console.log('📥 eCourtsIndia API response:', JSON.stringify(apiData).substring(0, 500));

      // Check for API-level errors in 200 responses (e.g. insufficient credits)
      const apiError = apiData?.error || apiData?.message || apiData?.status;
      const isApiError = apiData?.success === false 
        || (typeof apiError === 'string' && /insufficient|invalid.*token|expired|unauthorized|error/i.test(apiError))
        || (typeof apiData?.status === 'string' && /error|fail/i.test(apiData.status));
      
      if (isApiError && !apiData?.data) {
        const errMsg = mapErrorCode(apiData?.error?.code, apiData?.error?.message || apiData?.message || apiData?.error || 'API returned an error');
        console.error(`❌ eCourtsIndia API-level error: ${errMsg}`, JSON.stringify(apiData));
        
        if (searchRecord) {
          await supabase.from('legalkart_case_searches')
            .update({ status: 'failed', error_message: errMsg, response_data: apiData }).eq('id', searchRecord.id);
        }
        
        return new Response(JSON.stringify({ success: false, error: errMsg, data: null, raw: apiData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log('✅ eCourtsIndia API returned valid data for:', normalizedCnr);

      // Update search record
      if (searchRecord) {
        await supabase.from('legalkart_case_searches')
          .update({ response_data: apiData, status: 'success' }).eq('id', searchRecord.id);
      }

      // Resolve case ID
      let effectiveCaseId = caseId || null;
      if (!effectiveCaseId) {
        const { data: foundCase } = await supabase.from('cases').select('id')
          .eq('firm_id', firmId).eq('cnr_number', normalizedCnr).maybeSingle();
        if (foundCase?.id) {
          effectiveCaseId = foundCase.id;
          if (searchRecord) {
            await supabase.from('legalkart_case_searches')
              .update({ case_id: effectiveCaseId }).eq('id', searchRecord.id);
          }
        }
      }

      // Upsert case data if we have a caseId
      if (effectiveCaseId && apiData?.data) {
        const mapped = mapEcourtsCaseToCRM(apiData);
        const validCaseFields = [
          'case_title', 'case_number', 'case_type', 'status', 'priority', 'stage',
          'cnr_number', 'filing_number', 'registration_number',
          'filing_date', 'registration_date', 'first_hearing_date', 'next_hearing_date',
          'disposal_date', 'decision_date',
          'petitioner', 'respondent', 'petitioner_advocate', 'respondent_advocate',
          'court', 'court_name', 'court_type', 'district', 'state', 'bench_type',
          'coram', 'category', 'under_act', 'under_section', 'vs', 'advocate_name',
          'description',
        ];
        const caseUpdate: any = {
          last_fetched_at: new Date().toISOString(),
          fetched_data: apiData,
          fetch_status: 'success',
          fetch_message: `Fetched from eCourtsIndia on ${new Date().toISOString()}`,
          is_auto_fetched: true,
        };
        for (const field of validCaseFields) {
          const v = (mapped as any)[field];
          if (v !== undefined && v !== null) caseUpdate[field] = v;
        }
        await supabase.from('cases').update(caseUpdate).eq('id', effectiveCaseId);

        // Check if Supreme Court
        const isSupremeCourt = normalizedCnr.startsWith('SCIN') ||
          apiData?.data?.courtCaseData?.courtName?.toLowerCase()?.includes('supreme');

        try {
          if (isSupremeCourt) {
            await upsertSupremeCourtData(supabase, effectiveCaseId, firmId, apiData);
          } else {
            await upsertCaseRelationalData(supabase, effectiveCaseId, apiData);
          }
        } catch (e) {
          console.error('Failed to upsert relational data:', e);
        }
      }

      return new Response(JSON.stringify({ success: true, data: apiData?.data ?? apiData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: upsert_from_json =====
    if (action === 'upsert_from_json') {
      const { caseId, rawData } = requestBody;
      if (!caseId || !rawData) {
        return new Response(JSON.stringify({ error: 'caseId and rawData required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const mapped = mapEcourtsCaseToCRM(rawData);
      const allowedKeys = [
        'case_title','filing_date','registration_date','first_hearing_date','next_hearing_date',
        'decision_date','disposal_date','petitioner','respondent','petitioner_advocate','respondent_advocate',
        'court','court_name','court_type','district','state','bench_type','coram','stage','category',
        'case_type','status','priority','under_act','under_section','vs','advocate_name','description',
      ];
      const updatePayload: any = {
        is_auto_fetched: true, fetch_status: 'success',
        fetch_message: `JSON upsert on ${new Date().toISOString()}`,
        last_fetched_at: new Date().toISOString(), fetched_data: rawData,
      };
      for (const key of allowedKeys) {
        const v = (mapped as any)[key];
        if (v !== undefined && v !== null) updatePayload[key] = v;
      }
      await supabase.from('cases').update(updatePayload).eq('id', caseId);

      const isSupremeCourt = (mapped.cnr_number ?? '').startsWith('SCIN');
      if (isSupremeCourt) {
        await upsertSupremeCourtData(supabase, caseId, firmId, rawData);
      } else {
        await upsertCaseRelationalData(supabase, caseId, rawData);
      }

      return new Response(JSON.stringify({ success: true, message: 'Case data upserted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: case_search =====
    if (action === 'case_search') {
      const { query, advocates, judges, petitioners, respondents, litigants,
        courtCodes, caseTypes, caseStatuses, filingDateFrom, filingDateTo,
        pageSize = 20, page = 1 } = requestBody;

      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (advocates) params.set('advocates', advocates);
      if (judges) params.set('judges', judges);
      if (petitioners) params.set('petitioners', petitioners);
      if (respondents) params.set('respondents', respondents);
      if (litigants) params.set('litigants', litigants);
      if (filingDateFrom) params.set('filingDateFrom', filingDateFrom);
      if (filingDateTo) params.set('filingDateTo', filingDateTo);
      params.set('pageSize', String(pageSize));
      params.set('page', String(page));
      // Array params
      if (Array.isArray(courtCodes)) courtCodes.forEach((c: string) => params.append('courtCodes', c));
      if (Array.isArray(caseTypes)) caseTypes.forEach((t: string) => params.append('caseTypes', t));
      if (Array.isArray(caseStatuses)) caseStatuses.forEach((s: string) => params.append('caseStatuses', s));

      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/search?${params.toString()}`,
        { method: 'GET', headers: authHeaders() },
        30000
      );

      const data = await response.json();
      if (!response.ok) {
        return new Response(JSON.stringify({ success: false, error: data?.error?.message ?? 'Search failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: case_refresh =====
    if (action === 'case_refresh') {
      const { cnr } = requestBody;
      const parsedCnr = cnrSchema.safeParse(cnr);
      if (!parsedCnr.success) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid CNR' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/case/${parsedCnr.data}/refresh`,
        { method: 'POST', headers: authHeaders() },
        15000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: bulk_refresh =====
    if (action === 'bulk_refresh') {
      const { cnrs } = requestBody;
      if (!Array.isArray(cnrs) || cnrs.length === 0 || cnrs.length > 50) {
        return new Response(JSON.stringify({ success: false, error: 'Provide 1-50 CNRs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const normalized = cnrs.map((c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, ''));

      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/case/bulk-refresh`,
        { method: 'POST', headers: authHeaders(), body: JSON.stringify({ cnrs: normalized }) },
        30000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: order_pdf =====
    if (action === 'order_pdf') {
      const { cnr, filename } = requestBody;
      const parsedCnr = cnrSchema.safeParse(cnr);
      if (!parsedCnr.success || !filename) {
        return new Response(JSON.stringify({ success: false, error: 'CNR and filename required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/case/${parsedCnr.data}/order/${encodeURIComponent(filename)}`,
        { method: 'GET', headers: authHeaders() },
        30000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: order_ai =====
    if (action === 'order_ai') {
      const { cnr, filename } = requestBody;
      const parsedCnr = cnrSchema.safeParse(cnr);
      if (!parsedCnr.success || !filename) {
        return new Response(JSON.stringify({ success: false, error: 'CNR and filename required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/case/${parsedCnr.data}/order-ai/${encodeURIComponent(filename)}`,
        { method: 'GET', headers: authHeaders() },
        90000 // AI analysis can take 10-60s
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: order_markdown =====
    if (action === 'order_markdown') {
      const { cnr, filename } = requestBody;
      const parsedCnr = cnrSchema.safeParse(cnr);
      if (!parsedCnr.success || !filename) {
        return new Response(JSON.stringify({ success: false, error: 'CNR and filename required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/case/${parsedCnr.data}/order-md/${encodeURIComponent(filename)}`,
        { method: 'GET', headers: authHeaders() },
        310000 // Can take up to 300s
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: causelist_search =====
    if (action === 'causelist_search') {
      const { q, date, startDate, endDate, judge, advocate, state, districtCode,
        courtComplexCode, court, courtNo, bench, litigant, listType,
        limit = 100, offset = 0 } = requestBody;

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (date) params.set('date', date);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (judge) params.set('judge', judge);
      if (advocate) params.set('advocate', advocate);
      if (state) params.set('state', state);
      if (districtCode) params.set('districtCode', districtCode);
      if (courtComplexCode) params.set('courtComplexCode', courtComplexCode);
      if (court) params.set('court', court);
      if (courtNo) params.set('courtNo', courtNo);
      if (bench) params.set('bench', bench);
      if (litigant) params.set('litigant', litigant);
      if (listType) params.set('listType', listType);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/causelist/search?${params.toString()}`,
        { method: 'GET', headers: authHeaders() },
        30000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: causelist_dates =====
    if (action === 'causelist_dates') {
      const { state, districtCode, courtComplexCode, courtNo, court } = requestBody;
      const params = new URLSearchParams();
      if (state) params.set('state', state);
      if (districtCode) params.set('districtCode', districtCode);
      if (courtComplexCode) params.set('courtComplexCode', courtComplexCode);
      if (courtNo) params.set('courtNo', courtNo);
      if (court) params.set('court', court);

      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/causelist/available-dates?${params.toString()}`,
        { method: 'GET', headers: authHeaders() },
        15000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: court_structure =====
    if (action === 'court_structure') {
      const { endpoint } = requestBody; // e.g. "states", "states/DL/districts", etc.
      if (!endpoint) {
        return new Response(JSON.stringify({ success: false, error: 'endpoint required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/causelist/court-structure/${endpoint}`,
        { method: 'GET', headers: authHeaders() },
        15000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: enums =====
    if (action === 'enums') {
      const { types } = requestBody; // e.g. "caseStatus,caseType"
      const params = types ? `?types=${types}` : '';
      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/enums${params}`,
        { method: 'GET', headers: { 'Accept': 'application/json' } },
        15000
      );
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data: data?.data ?? data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: sync_display_board (cause list sync to case_hearings) =====
    if (action === 'sync_display_board') {
      const targetDate = requestBody.targetDate || new Date().toISOString().split('T')[0];
      console.log('🔄 Syncing cause list hearings for:', targetDate);

      // Search cause list for the firm's state/court
      const { state: clState, districtCode: clDistrict, advocate: clAdvocate } = requestBody;

      const params = new URLSearchParams();
      params.set('date', targetDate);
      if (clState) params.set('state', clState);
      if (clDistrict) params.set('districtCode', clDistrict);
      if (clAdvocate) params.set('advocate', clAdvocate);
      params.set('limit', '100');

      const response = await fetchWithTimeout(
        `${ECOURTS_BASE}/api/partner/causelist/search?${params.toString()}`,
        { method: 'GET', headers: authHeaders() },
        30000
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return new Response(JSON.stringify({ success: false, error: errData?.error?.message ?? 'Cause list fetch failed', synced: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const clData = await response.json();
      const items = clData?.data?.results ?? [];
      console.log(`📋 Cause list returned ${items.length} items`);

      if (items.length === 0) {
        return new Response(JSON.stringify({ success: true, synced: 0, message: 'No items in cause list' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Match by case number or CNR
      const caseNumbers = items.map((item: any) => item.caseNumber?.[0] ?? null).filter(Boolean);
      const cnrs = items.map((item: any) => item.cnr).filter(Boolean);

      let matchedCases: any[] = [];
      if (caseNumbers.length > 0) {
        const { data } = await supabase.from('cases').select('id, case_number, cnr_number')
          .eq('firm_id', firmId).in('case_number', caseNumbers);
        matchedCases = data ?? [];
      }
      if (cnrs.length > 0) {
        const { data } = await supabase.from('cases').select('id, case_number, cnr_number')
          .eq('firm_id', firmId).in('cnr_number', cnrs);
        if (data) matchedCases = [...matchedCases, ...data];
      }

      // Deduplicate
      const caseMap = new Map<string, any>();
      matchedCases.forEach(c => caseMap.set(c.id, c));

      const hearingUpserts: any[] = [];
      items.forEach((item: any) => {
        const matchedCase = [...caseMap.values()].find(c =>
          (item.cnr && c.cnr_number === item.cnr) ||
          (item.caseNumber?.[0] && c.case_number === item.caseNumber[0])
        );
        if (!matchedCase) return;

        hearingUpserts.push({
          case_id: matchedCase.id,
          firm_id: firmId,
          hearing_date: targetDate,
          judge: (item.judge ?? []).join(', ') || null,
          court_name: item.courtName ?? null,
          purpose_of_hearing: item.status ?? null,
          cause_list_type: item.listType ?? 'DAILY BOARD',
          status: 'scheduled',
          notes: item.listingNo ? `Listing No. ${item.listingNo}` : null,
        });
      });

      if (hearingUpserts.length > 0) {
        const caseIds = [...new Set(hearingUpserts.map(h => h.case_id))];
        const { data: existing } = await supabase.from('case_hearings').select('case_id')
          .eq('hearing_date', targetDate).in('case_id', caseIds);
        const existingIds = new Set((existing ?? []).map((h: any) => h.case_id));
        const newHearings = hearingUpserts.filter(h => !existingIds.has(h.case_id));
        if (newHearings.length > 0) {
          await supabase.from('case_hearings').insert(newHearings);
        }
      }

      return new Response(JSON.stringify({
        success: true, synced: hearingUpserts.length,
        total_cause_list_items: items.length, matched_cases: caseMap.size,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ACTION: batch_search (legacy compat - calls case_detail for each) =====
    if (action === 'batch_search') {
      const { cnrs } = requestBody;
      if (!Array.isArray(cnrs) || cnrs.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Provide CNR array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const results: any[] = [];
      for (const rawCnr of cnrs.slice(0, 50)) {
        try {
          const normalized = rawCnr.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const resp = await fetchWithTimeout(
            `${ECOURTS_BASE}/api/partner/case/${normalized}`,
            { method: 'GET', headers: authHeaders() },
            25000
          );
          const data = await resp.json();
          results.push({ cnr: normalized, success: resp.ok, data: resp.ok ? data?.data : null, error: resp.ok ? null : data?.error?.message });
        } catch (e: any) {
          results.push({ cnr: rawCnr, success: false, error: e.message });
        }
        // Small delay between requests
        await new Promise(r => setTimeout(r, 200));
      }
      return new Response(JSON.stringify({ success: true, processed: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Unknown action
    return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
