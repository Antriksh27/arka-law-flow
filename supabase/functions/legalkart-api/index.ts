import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { parseECourtsData, type ParsedCaseData } from "./dataParser.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const searchTypeEnum = z.enum(['high_court', 'district_court', 'supreme_court', 'gujarat_display_board', 'district_cause_list'])

const caseSearchSchema = z.object({
  cnr: z.string().trim().min(1).max(50).regex(/^[A-Z0-9]+$/, "CNR must contain only uppercase letters and numbers"),
  searchType: searchTypeEnum,
  caseId: z.string().uuid().optional()
})

const batchSearchSchema = z.object({
  cnrs: z.array(z.string().trim().min(1).max(50).regex(/^[A-Z0-9]+$/)).min(1).max(100)
})

const authSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1)
})

interface LegalkartAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

interface LegalkartCaseSearchRequest {
  cnr: string;
  searchType: 'high_court' | 'district_court' | 'supreme_court' | 'gujarat_display_board' | 'district_cause_list';
  caseId?: string;
}

// Helper function to upsert case relational data
async function upsertCaseRelationalData(
  supabase: any,
  caseId: string,
  firmId: string,
  rawData: any
) {
  console.log('📦 Upserting relational data for case:', caseId);
  
  // Handle nested shape: some providers return { data: {...}, success: true }
  const rd = rawData?.data ?? rawData ?? {};

  // Date normalization helpers
  const monthIndex: Record<string, string> = {
    january: '01', jan: '01',
    february: '02', feb: '02',
    march: '03', mar: '03',
    april: '04', apr: '04',
    may: '05',
    june: '06', jun: '06',
    july: '07', jul: '07',
    august: '08', aug: '08',
    september: '09', sep: '09', sept: '09',
    october: '10', oct: '10',
    november: '11', nov: '11',
    december: '12', dec: '12',
  };
  const stripOrdinals = (s: string) => s.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1');
  const cleanup = (s: string) => s.replace(/\(.*?\)/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const nullTokens = new Set(['', '-', '--', '—', 'n/a', 'na', 'nil', 'null', 'undefined', '#', '— —']);
  const normalizeDate = (val: unknown): string | null => {
    if (val == null) return null;
    let s = typeof val === 'string' ? val : val instanceof Date ? val.toISOString() : String(val);
    s = cleanup(s).trim();
    if (nullTokens.has(s.toLowerCase())) return null;

    // ISO with time
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
    // Already ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
    const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    // dd Month yyyy (with optional dot and ordinals)
    s = stripOrdinals(s);
    const m2 = s.match(/^(\d{1,2})\s+([A-Za-z\.]+)\s+(\d{4})$/);
    if (m2) {
      const dd = m2[1].padStart(2, '0');
      const monKey = m2[2].toLowerCase().replace(/\.$/, '');
      const mon = monthIndex[monKey];
      const yyyy = m2[3];
      if (mon) return `${yyyy}-${mon}-${dd}`;
    }

    // Fallback: Date.parse
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

    return null;
  };

  // Parse with AI parser (handles petitioner/respondent strings)
  const parsedData = parseECourtsData(rd);
  
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

  // Insert petitioners
  if (parsedData.petitioners.length > 0) {
    const { error } = await supabase.from('petitioners').insert(
      parsedData.petitioners.map(p => ({
        case_id: caseId,
        petitioner_name: p.name,
        advocate_name: p.advocate,
      }))
    );
    if (error) console.error('Error inserting petitioners:', error);
  }

  // Insert respondents
  if (parsedData.respondents.length > 0) {
    const { error } = await supabase.from('respondents').insert(
      parsedData.respondents.map(r => ({
        case_id: caseId,
        respondent_name: r.name,
        advocate_name: r.advocate,
      }))
    );
    if (error) console.error('Error inserting respondents:', error);
  }

  // Insert IA details
  if (parsedData.iaDetails.length > 0) {
    const { error } = await supabase.from('ia_details').insert(
      parsedData.iaDetails.map(ia => ({
        case_id: caseId,
        ia_number: ia.iaNumber,
        party: ia.party,
        date_of_filing: normalizeDate(ia.dateOfFiling),
        next_date: normalizeDate(ia.nextDate),
        ia_status: ia.iaStatus,
      }))
    );
    if (error) console.error('Error inserting IA details:', error);
  }

  // Insert documents
  const documents = Array.isArray(rd?.documents) ? rd.documents : [];
  if (documents.length > 0) {
    const { error } = await supabase.from('case_documents').insert(
      documents.map((d: any) => ({
        case_id: caseId,
        sr_no: d.sr_no ?? null,
        document_filed: d.document_filed ?? null,
        filed_by: d.filed_by ?? null,
        advocate: d.advocate ?? null,
        document_no: d.document_no ?? null,
        date_of_receiving: normalizeDate(d.date_of_receiving),
        document_type: d.document_type ?? null,
        document_url: d.document_link || d.document_url || null,
        pdf_base64: d.pdf_base64 ?? null,
      }))
    );
    if (error) console.error('Error inserting documents:', error);
  }

  // Insert orders - Check multiple possible paths including LegalKart formats
  const orders = Array.isArray(rd?.order_details) 
    ? rd.order_details 
    : Array.isArray(rd?.data?.order_details)
    ? rd.data.order_details
    : Array.isArray(rd?.orders)
    ? rd.orders
    : Array.isArray(rd?.data?.orders)
    ? rd.data.orders
    : Array.isArray(rd?.orderList)
    ? rd.orderList
    : Array.isArray(rd?.data?.orderList)
    ? rd.data.orderList
    : Array.isArray(rd?.final_orders)
    ? rd.final_orders
    : Array.isArray(rd?.data?.final_orders)
    ? rd.data.final_orders
    : Array.isArray(rd?.interim_orders)
    ? rd.interim_orders
    : Array.isArray(rd?.data?.interim_orders)
    ? rd.data.interim_orders
    : [];
  
  console.log(`📋 Found ${orders.length} orders to insert from raw data`);
  if (orders.length > 0) {
    console.log('First order structure:', JSON.stringify(orders[0], null, 2));
  }
  
  if (orders.length > 0) {
    const { error } = await supabase.from('case_orders').insert(
      orders.map((o: any) => ({
        case_id: caseId,
        judge: o.judge || o.judge_name || null,
        hearing_date: normalizeDate(o.hearing_date),
        order_date: normalizeDate(o.order_date || o.date),
        order_number: o.order_number || o.order_no || null,
        bench: o.bench ?? null,
        order_details: o.order_details || o.details || null,
        summary: o.summary || o.order_summary || null,
        order_link: o.order_link || o.pdf_url || o.pdf_link || null,
        pdf_base64: o.pdf_base64 ?? null,
      }))
    );
    if (error) console.error('❌ Error inserting orders:', error);
    else console.log(`✅ Successfully inserted ${orders.length} orders`);
  } else {
    console.log('⚠️ No orders found. Checked paths: rd.order_details, rd.data.order_details, rd.orders, rd.data.orders, rd.orderList, rd.data.orderList, rd.final_orders, rd.interim_orders');
    // Fallback: derive pseudo-orders from hearings/document signals
    const hearingCandidates = Array.isArray(rd?.history_of_case_hearing) 
      ? rd.history_of_case_hearing 
      : Array.isArray(rd?.data?.history_of_case_hearing)
      ? rd.data.history_of_case_hearing
      : [];

    const orderLikePurposes = /order|orders|judgment|disposed|final/i;
    const derivedFromHearings = hearingCandidates
      .filter((h: any) => (h.purpose_of_hearing || h.purpose) && orderLikePurposes.test(String(h.purpose_of_hearing || h.purpose)))
      .map((h: any) => ({
        case_id: caseId,
        judge: h.judge || h.judge_name || null,
        hearing_date: normalizeDate(h.hearing_date || h.date),
        order_date: normalizeDate(h.hearing_date || h.date),
        order_number: null,
        bench: h.bench ?? null,
        order_details: h.purpose_of_hearing || h.purpose || null,
        summary: 'Derived from hearing history',
        order_link: null,
        pdf_base64: null,
      }));

    // Also derive from documents that look like orders/judgments
    const docs = Array.isArray(rd?.documents) ? rd.documents : Array.isArray(rd?.data?.documents) ? rd.data.documents : [];
    const derivedFromDocuments = docs
      .filter((d: any) => /order|judgment/i.test(String(d.document_filed || d.document_type || '')))
      .map((d: any) => ({
        case_id: caseId,
        judge: null,
        hearing_date: normalizeDate(d.date_of_receiving),
        order_date: normalizeDate(d.date_of_receiving),
        order_number: d.document_no || null,
        bench: null,
        order_details: d.document_filed || d.document_type || 'Order Document',
        summary: 'Derived from documents',
        order_link: d.document_link || d.document_url || null,
        pdf_base64: d.pdf_base64 || null,
      }));

    const derivedOrders = [...derivedFromHearings, ...derivedFromDocuments];
    if (derivedOrders.length > 0) {
      const { error } = await supabase.from('case_orders').insert(derivedOrders);
      if (error) console.error('❌ Error inserting derived orders:', error);
      else console.log(`✅ Inserted ${derivedOrders.length} derived orders`);
    } else {
      console.log('ℹ️ No derived orders could be created');
    }
  }

  // Insert hearings - Check multiple possible paths including district court case_history
  const hearings = Array.isArray(rd?.case_history) 
    ? rd.case_history 
    : Array.isArray(rd?.data?.case_history)
    ? rd.data.case_history
    : Array.isArray(rd?.history_of_case_hearing) 
    ? rd.history_of_case_hearing 
    : Array.isArray(rd?.data?.history_of_case_hearing)
    ? rd.data.history_of_case_hearing
    : Array.isArray(rd?.hearings)
    ? rd.hearings
    : Array.isArray(rd?.data?.hearings)
    ? rd.data.hearings
    : [];
  
  console.log(`📅 Found ${hearings.length} hearings to insert`);
  
  if (hearings.length > 0) {
    const { error } = await supabase.from('case_hearings').insert(
      hearings.map((h: any) => ({
        case_id: caseId,
        hearing_date: normalizeDate(h.hearing_date || h.date),
        judge: h.judge || h.judge_name || null,
        cause_list_type: h.cause_list_type ?? null,
        business_on_date: h.business_on_date || h.purpose_of_hearing || h.purpose || null,
        purpose_of_hearing: h.purpose_of_hearing || h.purpose || null,
      }))
    );
    if (error) console.error('❌ Error inserting hearings:', error);
    else console.log(`✅ Successfully inserted ${hearings.length} hearings`);
  }

  // Insert objections
  const objections = Array.isArray(rd?.objections) ? rd.objections : [];
  if (objections.length > 0) {
    const { error } = await supabase.from('case_objections').insert(
      objections.map((o: any) => ({
        case_id: caseId,
        sr_no: o.sr_no ?? null,
        objection: o.objection ?? null,
        receipt_date: normalizeDate(o.receipt_date),
        scrutiny_date: normalizeDate(o.scrutiny_date),
        compliance_date: normalizeDate(o.objection_compliance_date ?? o.compliance_date),
      }))
    );
    if (error) console.error('Error inserting objections:', error);
  }

  console.log('✅ Relational data upserted successfully');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const legalkartUserId = Deno.env.get('LEGALKART_USER_ID');
    const legalkartHashKey = Deno.env.get('LEGALKART_HASH_KEY');

    console.log('Environment check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'NOT SET');
    console.log('- LEGALKART_USER_ID:', legalkartUserId ? 'SET' : 'NOT SET');
    console.log('- LEGALKART_HASH_KEY:', legalkartHashKey ? 'SET' : 'NOT SET');

    // Note: Legalkart credentials are only required for external API actions (authenticate/search).
    // Proceeding without them for local upsert actions like 'upsert_from_json'.
    if (!legalkartUserId || !legalkartHashKey) {
      console.warn('Legalkart credentials not configured - skipping for non-external actions');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Parse request body early
    const requestBody = await req.json();
    const { action } = requestBody;

    console.log(`📨 Request action: ${action}`);

    // Detect call type: internal (from another edge function) vs user (from frontend)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const apikeyHeader = req.headers.get('apikey') || req.headers.get('x-api-key') || '';
    const isInternalCall = apikeyHeader === serviceRoleKey;

    let teamMember: { firm_id: string; role: string };
    let userId: string;

    if (isInternalCall) {
      // Internal call from process-fetch-queue or other edge functions
      console.log('🔧 Internal call detected');
      
      if (!requestBody.firmId) {
        console.error('❌ firmId is required for internal calls');
        return new Response(
          JSON.stringify({ success: false, error: 'firmId is required for internal calls' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      teamMember = { firm_id: requestBody.firmId, role: 'system' };
      userId = requestBody.userId || 'system';
      console.log(`✅ Internal call authorized: firmId=${teamMember.firm_id}, action=${action}`);
    } else {
      // User call from frontend
      console.log('👤 User call detected');
      
      if (!authHeader.startsWith('Bearer ')) {
        console.error('❌ Missing Authorization header');
        return new Response(
          JSON.stringify({ success: false, error: 'Missing Authorization. Please sign in.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decode JWT locally to extract userId (sub claim)
      try {
        const jwt = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        userId = payload.sub;

        if (!userId) {
          throw new Error('Missing sub claim in JWT');
        }

        console.log(`🔍 Decoded userId from JWT: ${userId}`);

        // Look up team_members to get firm_id
        const { data: tm, error: tmError } = await supabase
          .from('team_members')
          .select('firm_id, role')
          .eq('user_id', userId)
          .single();

        if (tmError || !tm) {
          console.error('❌ User not found in team_members:', tmError);
          return new Response(
            JSON.stringify({ success: false, error: 'User not authorized. Please contact your administrator.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        teamMember = tm;
        console.log(`✅ User authorized: userId=${userId}, firmId=${teamMember.firm_id}, role=${teamMember.role}, action=${action}`);
      } catch (e) {
        console.error('❌ JWT decode error:', e);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'authenticate') {
      // Authenticate with Legalkart API
      const authResult = await authenticateWithLegalkart(legalkartUserId, legalkartHashKey);
      
      return new Response(JSON.stringify(authResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'upsert_from_json') {
      const { caseId, rawData } = requestBody;
      
      if (!caseId || !rawData) {
        return new Response(
          JSON.stringify({ error: 'Case ID and raw data are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('📥 Upserting case data from JSON for case:', caseId);

      try {
        // 1) Map and update case-level fields (dates, parties, status, etc.)
        const mapped = mapLegalkartDataToCRM(rawData, 'local_json') || {};
        const allowedKeys = [
          'case_title','filing_date','registration_date','first_hearing_date','next_hearing_date',
          'listed_date','decision_date','disposal_date','scrutiny_date',
          'petitioner','respondent','petitioner_advocate','respondent_advocate',
          'court','court_name','court_type','district','state','judicial_branch','bench_type',
          'coram','stage','category','sub_category','case_classification','case_type','status','priority',
          'orders','interim_orders','final_orders','document_links','hearing_history','document_history',
          'party_details','ia_numbers','objection','objection_status','under_act','under_section','acts','sections',
          'vs','advocate_name','cause_list_type','purpose_of_hearing','hearing_notes'
        ];
        const updatePayload: Record<string, any> = {
          is_auto_fetched: true,
          fetch_status: 'success',
          fetch_message: `Local JSON upsert on ${new Date().toISOString()}`,
          last_fetched_at: new Date().toISOString(),
          fetched_data: rawData,
        };
        for (const key of allowedKeys) {
          const v = mapped[key];
          if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) {
            updatePayload[key] = v;
          }
        }

        const { error: caseUpdateErr } = await supabase
          .from('cases')
          .update(updatePayload)
          .eq('id', caseId);

        if (caseUpdateErr) {
          console.error('❌ Failed to update case fields:', caseUpdateErr);
        } else {
          const updatedKeys = Object.keys(updatePayload).filter(k => !['fetched_data','fetch_message'].includes(k));
          console.log(`✅ Updated case with ${updatedKeys.length} fields:`, updatedKeys);
        }

        // 2) Upsert child/relational tables
        await upsertCaseRelationalData(supabase, caseId, teamMember.firm_id, rawData);

        // Prepare simple counts for debugging
        const rd = rawData?.data ?? rawData ?? {};
        const ordersArr = Array.isArray(rd?.order_details) ? rd.order_details
          : Array.isArray(rd?.data?.order_details) ? rd.data.order_details
          : Array.isArray(rd?.orders) ? rd.orders
          : Array.isArray(rd?.data?.orders) ? rd.data.orders
          : Array.isArray(rd?.orderList) ? rd.orderList
          : Array.isArray(rd?.data?.orderList) ? rd.data.orderList
          : [];
        const hearingsArr = Array.isArray(rd?.history_of_case_hearing) ? rd.history_of_case_hearing
          : Array.isArray(rd?.data?.history_of_case_hearing) ? rd.data.history_of_case_hearing
          : Array.isArray(rd?.hearings) ? rd.hearings
          : Array.isArray(rd?.data?.hearings) ? rd.data.hearings
          : [];

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Case data upserted successfully',
            counts: {
              orders: ordersArr.length,
              hearings: hearingsArr.length,
            },
            updated_dates: {
              filing_date: updatePayload.filing_date || null,
              registration_date: updatePayload.registration_date || null,
              first_hearing_date: updatePayload.first_hearing_date || null,
              next_hearing_date: updatePayload.next_hearing_date || null,
              listed_date: updatePayload.listed_date || null,
              decision_date: updatePayload.decision_date || null,
              disposal_date: updatePayload.disposal_date || null,
              scrutiny_date: updatePayload.scrutiny_date || null,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error upserting case data:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to upsert case data: ' + (error as Error).message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'search') {
      const { cnr, searchType, caseId, isSystemTriggered }: LegalkartCaseSearchRequest & { isSystemTriggered?: boolean } = requestBody;
      
      // Validate input using Zod
      const validation = caseSearchSchema.safeParse({ cnr, searchType, caseId })
      
      if (!validation.success) {
        console.error('Validation failed for search:', validation.error.flatten())
        return new Response(
          JSON.stringify({ 
            error: 'Invalid input',
            details: validation.error.flatten().fieldErrors
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validatedData = validation.data
      console.log(`Starting Legalkart search for CNR: ${validatedData.cnr}, Type: ${validatedData.searchType}, System: ${isSystemTriggered || false}`);
      
      // Normalize CNR: remove hyphens and spaces before searching
      const normalizedCnr = validatedData.cnr.replace(/[-\s]/g, '');
      console.log('Normalized CNR for API:', normalizedCnr);

      // First authenticate
      const authResult = await authenticateWithLegalkart(legalkartUserId, legalkartHashKey);
      if (!authResult.success || !authResult.token) {
        console.error('Authentication failed:', authResult.error);
        return new Response(
          JSON.stringify({ error: 'Authentication failed: ' + authResult.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create search record (skip if system-triggered to avoid user_id issues)
      let searchRecord: any = null;
      if (!isSystemTriggered) {
        const { data: sr, error: insertError } = await supabase
          .from('legalkart_case_searches')
          .insert({
            firm_id: teamMember.firm_id,
            case_id: validatedData.caseId || null,
            cnr_number: normalizedCnr,
            search_type: validatedData.searchType,
            request_data: { cnr: validatedData.cnr, searchType: validatedData.searchType },
            created_by: userId,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating search record:', insertError);
        } else {
          searchRecord = sr;
        }
      } else {
        console.log('⚙️ System-triggered search - skipping search record creation');
      }

      // Perform the search using normalized CNR
      const searchResult = await performCaseSearch(authResult.token, normalizedCnr, validatedData.searchType);

      // Update search record with results (if one was created)
      if (searchRecord) {
        const { error: updateError } = await supabase
          .from('legalkart_case_searches')
          .update({
            response_data: searchResult.data,
            status: searchResult.success ? 'success' : 'failed',
            error_message: searchResult.error || null,
          })
          .eq('id', searchRecord.id);

        if (updateError) {
          console.error('Error updating search record:', updateError);
        }
      }

      // Resolve caseId if not provided by finding a case with the same CNR in user's firm
      let effectiveCaseId = caseId || null;
      if (!effectiveCaseId) {
        const { data: foundCase } = await supabase
          .from('cases')
          .select('id')
          .eq('firm_id', teamMember.firm_id)
          .eq('cnr_number', normalizedCnr)
          .maybeSingle();
        if (foundCase?.id) {
          effectiveCaseId = foundCase.id;
          // Link the search record to the found case (if one was created)
          if (searchRecord) {
            await supabase
              .from('legalkart_case_searches')
              .update({ case_id: effectiveCaseId })
              .eq('id', searchRecord.id);
          }
        }
      }

      // Update case with fetched data if successful and a case_id is available
      if (searchResult.success && effectiveCaseId && searchResult.data) {
        const mappedData = mapLegalkartDataToCRM(searchResult.data, validatedData.searchType);
        
        // Log the mapped data fields for debugging
        console.log('📊 Mapped Data Summary:');
        console.log('  - Filing Date:', mappedData.filing_date);
        console.log('  - Registration Date:', mappedData.registration_date);
        console.log('  - First Hearing Date:', mappedData.first_hearing_date);
        console.log('  - Next Hearing Date:', mappedData.next_hearing_date);
        console.log('  - Registration Number:', mappedData.registration_number);
        console.log('  - Filing Number:', mappedData.filing_number);
        console.log('  - Case Type:', mappedData.case_type);
        console.log('  - Court Name:', mappedData.court_name);
        console.log('  - Stage:', mappedData.stage);
        
        // Valid case table columns - only include these in the update
        const validCaseFields = [
          'case_title', 'case_number', 'case_type', 'status', 'priority', 'stage',
          'cnr_number', 'filing_number', 'registration_number', 'docket_number',
          'filing_date', 'registration_date', 'first_hearing_date', 'next_hearing_date',
          'listed_date', 'disposal_date', 'decision_date', 'scrutiny_date',
          'court', 'court_name', 'court_type', 'court_complex', 'district', 'state',
          'judicial_branch', 'bench_type', 'coram',
          'petitioner', 'petitioner_advocate', 'respondent', 'respondent_advocate',
          'acts', 'sections', 'under_act', 'under_section',
          'category', 'sub_category', 'case_sub_type', 'business_type', 'matter_type',
          'description', 'case_summary', 'vs',
          'fir_number', 'police_station', 'police_district', 'complaint_date',
          'filing_party', 'cause_list_type', 'purpose_of_hearing',
          'urgent_listing', 'listing_reason', 'interim_orders', 'final_orders'
        ];
        
        // Filter mappedData to only include valid fields
        const caseUpdate: any = { 
          last_fetched_at: new Date().toISOString(),
          fetched_data: searchResult.data,
          fetch_status: 'success',
          fetch_message: `Successfully fetched from ${searchType} on ${new Date().toISOString()}`,
          is_auto_fetched: true,
        };
        
        // Add only valid fields from mappedData
        for (const field of validCaseFields) {
          if (mappedData[field] !== undefined) {
            caseUpdate[field] = mappedData[field];
          }
        }
        
        // Update main cases table
        const { error: caseUpdateError } = await supabase
          .from('cases')
          .update(caseUpdate)
          .eq('id', effectiveCaseId);

        if (caseUpdateError) {
          console.error('Error updating case with fetched data:', caseUpdateError);
        } else {
          console.log('✅ Successfully updated case with all mapped fields');
        }

        // Upsert relational data using helper function
        try {
          await upsertCaseRelationalData(supabase, effectiveCaseId, teamMember.firm_id, searchResult.data);
          
          // Also populate legalkart_* tables via RPC
          console.log('📦 Calling upsert_legalkart_case_data RPC...');
          const parsedData = parseECourtsData(searchResult.data);
          const rd = searchResult.data?.data ?? searchResult.data ?? {};
          
          // Simple date normalizer for RPC calls
          const normDate = (val: any): string | null => {
            if (!val) return null;
            const s = String(val).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
            const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
            if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
            const d = new Date(s);
            return !isNaN(d.getTime()) ? d.toISOString().slice(0,10) : null;
          };
          
          // Prepare documents array
          const documents = Array.isArray(rd?.documents) ? rd.documents : [];
          const docsForRpc = documents.map((d: any) => ({
            document_name: d.document_filed ?? null,
            filed_by: d.filed_by ?? null,
            filed_date: normDate(d.date_of_receiving),
            document_type: d.document_type ?? null,
            document_url: d.document_link || d.document_url || null
          }));
          
          // Prepare objections array
          const objections = Array.isArray(rd?.objections) ? rd.objections : [];
          const objectionsForRpc = objections.map((o: any) => ({
            objection_date: normDate(o.receipt_date || o.scrutiny_date),
            objection_by: null,
            objection_status: o.objection_compliance_date ? 'Complied' : 'Pending',
            objection_details: o.objection ?? null
          }));
          
          // Prepare orders array - merge final_orders, interim_orders, order_details
          const finalOrders = Array.isArray(rd?.final_orders) ? rd.final_orders : [];
          const interimOrders = Array.isArray(rd?.interim_orders) ? rd.interim_orders : [];
          const orderDetails = Array.isArray(rd?.order_details) ? rd.order_details : [];
          const allOrders = [...finalOrders, ...interimOrders, ...orderDetails];
          const ordersForRpc = allOrders.map((o: any) => ({
            order_date: normDate(o.order_date || o.date || o.hearing_date),
            judge_name: o.judge || o.judge_name || null,
            order_summary: o.summary || o.details || o.purpose_of_hearing || null,
            order_link: o.order_link || o.pdf_url || o.pdf_link || null
          }));
          
          // Prepare history array - District courts use case_history
          const history = Array.isArray(rd?.case_history) 
            ? rd.case_history 
            : Array.isArray(rd?.history_of_case_hearing)
            ? rd.history_of_case_hearing
            : [];
          const historyForRpc = history.map((h: any) => ({
            hearing_date: normDate(h.hearing_date || h.date),
            judge_name: h.judge || h.judge_name || null,
            purpose: h.purpose_of_hearing || h.purpose || null,
            business_on_date: h.business_on_date ?? null
          }));
          
          // Prepare case data object - Support district court case_details and case_status_details
          const caseDetails = rd.case_details || rd.case_info || {};
          const caseStatus = rd.case_status_details || rd.case_status || {};
          const categoryInfo = rd.category_info || {};
          
          // Normalize case_type to valid enum values: civil, criminal, family, other
          let normalizedCaseType = 'civil';
          const rawCaseType = (caseDetails.case_type || mappedData.case_type || '').toString().toLowerCase();
          if (rawCaseType.includes('criminal')) normalizedCaseType = 'criminal';
          else if (rawCaseType.includes('family')) normalizedCaseType = 'family';
          else if (rawCaseType.includes('civil') || rawCaseType.includes('commercial')) normalizedCaseType = 'civil';
          else if (rawCaseType) normalizedCaseType = 'other';
          
          const caseDataForRpc = {
            filing_number: caseDetails.filing_number || rd.filing_number || null,
            filing_date: normDate(caseDetails.filing_date || rd.filing_date),
            registration_number: caseDetails.registration_number || rd.registration_number || null,
            registration_date: normDate(caseDetails.registration_date || rd.registration_date),
            cnr_number: mappedData.cnr_number || normalizedCnr,
            case_type: normalizedCaseType,
            case_status: caseStatus.case_stage || caseStatus.stage_of_case || rd.case_status || 'Active',
            stage_of_case: caseStatus.case_stage || caseStatus.stage_of_case || mappedData.stage || null,
            next_hearing_date: normDate(caseStatus.next_hearing_date || rd.next_hearing_date),
            coram: caseStatus.court_number_and_judge || caseStatus.coram || rd.coram || null,
            bench_type: caseStatus.bench_type || rd.bench_type || null,
            judicial_branch: caseStatus.judicial_branch || rd.judicial_branch || null,
            state: caseStatus.state || rd.state || null,
            district: caseStatus.district || rd.district || null,
            category: categoryInfo.category || rd.category || null,
            sub_category: categoryInfo.sub_category || rd.sub_category || null,
            petitioner_and_advocate: rd.petitioner_and_respondent_details?.petitioner_and_advocate || rd.petitioner_and_advocate || null,
            respondent_and_advocate: rd.petitioner_and_respondent_details?.respondent_and_advocate || rd.respondent_and_advocate || null,
            acts: mappedData.acts || []
          };
          
          const { data: legalkartCaseId, error: rpcError } = await supabase.rpc('upsert_legalkart_case_data', {
            p_cnr_number: normalizedCnr,
            p_firm_id: teamMember.firm_id,
            p_case_id: effectiveCaseId,
            p_case_data: caseDataForRpc,
            p_documents: docsForRpc,
            p_objections: objectionsForRpc,
            p_orders: ordersForRpc,
            p_history: historyForRpc,
            p_petitioners: parsedData.petitioners.map(p => ({ name: p.name, advocate: p.advocate })),
            p_respondents: parsedData.respondents.map(r => ({ name: r.name, advocate: r.advocate })),
            p_ia_details: parsedData.iaDetails.map(ia => ({
              ia_number: ia.iaNumber,
              party: ia.party,
              date_of_filing: normDate(ia.dateOfFiling),
              next_date: normDate(ia.nextDate),
              ia_status: ia.iaStatus
            }))
          });
          
          if (rpcError) {
            console.error('❌ Error calling upsert_legalkart_case_data:', rpcError);
          } else {
            console.log('✅ Successfully populated legalkart_* tables. LegalKart case ID:', legalkartCaseId);
          }
        } catch (upsertErr) {
          console.error('Failed to upsert case relational data:', upsertErr);
        }
      } else if (!searchResult.success && effectiveCaseId) {
        // Search failed - mark case as failed with error message
        console.log('⚠️ External search failed, updating case status...');
        
        const errorMessage = searchResult.error || 'Data not found in eCourts/LegalKart API';
        
        await supabase
          .from('cases')
          .update({
            fetch_status: 'failed',
            fetch_message: errorMessage,
            last_fetched_at: new Date().toISOString(),
          })
          .eq('id', effectiveCaseId);
        
        // Try using existing fetched_data if available
        const { data: existingCase } = await supabase
          .from('cases')
          .select('fetched_data')
          .eq('id', effectiveCaseId)
          .single();

        if (existingCase?.fetched_data) {
          console.log('✅ Found existing fetched_data, upserting relational data...');
          try {
            await upsertCaseRelationalData(supabase, effectiveCaseId, teamMember.firm_id, existingCase.fetched_data);
          } catch (upsertErr) {
            console.error('Failed to upsert from existing fetched_data:', upsertErr);
          }
        } else {
          console.log('❌ No existing fetched_data found');
        }
      }

      return new Response(JSON.stringify(searchResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'gujarat_display_board') {
      // First authenticate
      const authResult = await authenticateWithLegalkart(legalkartUserId, legalkartHashKey);
      if (!authResult.success || !authResult.token) {
        console.error('Authentication failed:', authResult.error);
        return new Response(
          JSON.stringify({ error: 'Authentication failed: ' + authResult.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const displayBoardResult = await getGujaratDisplayBoard(authResult.token);
      
      return new Response(JSON.stringify(displayBoardResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'batch_search') {
      // Validate input
      const validation = batchSearchSchema.safeParse(requestBody)
      
      if (!validation.success) {
        console.error('Validation failed for batch_search:', validation.error.flatten())
        return new Response(
          JSON.stringify({ 
            error: 'Invalid input',
            details: validation.error.flatten().fieldErrors
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { cnrs } = validation.data;
      console.log(`Starting batch search for ${cnrs.length} CNRs`);

      // First authenticate
      const authResult = await authenticateWithLegalkart(legalkartUserId, legalkartHashKey);
      if (!authResult.success || !authResult.token) {
        console.error('Authentication failed:', authResult.error);
        return new Response(
          JSON.stringify({ error: 'Authentication failed: ' + authResult.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const batchResults = [];
      for (const cnr of cnrs) {
        // Search in all court types for each CNR
        const searchTypes = ['high_court', 'district_court', 'supreme_court'] as const;
        
        for (const searchType of searchTypes) {
          const searchResult = await performCaseSearch(authResult.token, cnr, searchType);
          
          // Create search record
          const { error: insertError } = await supabase
            .from('legalkart_case_searches')
            .insert({
              firm_id: teamMember.firm_id,
              cnr_number: cnr,
              search_type: searchType,
              request_data: { cnr, searchType },
              response_data: searchResult.data,
              status: searchResult.success ? 'success' : 'failed',
              error_message: searchResult.error || null,
              created_by: userId,
            });

          if (insertError) {
            console.error('Error creating batch search record:', insertError);
          }

          batchResults.push({
            cnr,
            searchType,
            ...searchResult,
          });

          // Add small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        results: batchResults,
        processed: cnrs.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in legalkart-api function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function authenticateWithLegalkart(userId: string, hashKey: string): Promise<LegalkartAuthResponse> {
  try {
    console.log('Authenticating with Legalkart API...');
    console.log('User ID provided:', userId ? 'YES' : 'NO');
    console.log('Hash key provided:', hashKey ? 'YES' : 'NO');
    
    const requestBody = {
      user_id: userId,
      hash_key: hashKey,
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://apiservices.legalkart.com/api/v1/application-service/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Authentication request failed:', response.status, response.statusText);
      console.error('Error response body:', errorText);
      return { 
        success: false, 
        error: `Authentication failed: ${response.status} ${response.statusText} - ${errorText}` 
      };
    }

    const data = await response.json();
    console.log('Authentication response received:', JSON.stringify(data, null, 2));

    if (data.jwt) {
      console.log('Token received successfully');
      return { success: true, token: data.jwt };
    } else {
      console.log('No token in response. Full response:', data);
      return { 
        success: false, 
        error: data.message || data.error || 'No token received from authentication' 
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      success: false, 
      error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

async function performCaseSearch(token: string, cnr: string, searchType: string) {
  try {
    let endpoint = '';
    let method = 'POST';
    let body = JSON.stringify({ cnr });

    switch (searchType) {
      case 'high_court':
        endpoint = 'https://apiservices.legalkart.com/api/v1/application-service/case-search/high-court';
        break;
      case 'district_court':
        endpoint = 'https://apiservices.legalkart.com/api/v1/application-service/case-search/district-court';
        break;
      case 'supreme_court':
        endpoint = 'https://apiservices.legalkart.com/api/v1/application-service/case-search/supreme-court';
        break;
      case 'district_cause_list':
        endpoint = 'https://apiservices.legalkart.com/api/v1/application-service/case-search/district-court/cause-list-by-cnr';
        break;
      default:
        throw new Error(`Unsupported search type: ${searchType}`);
    }

    console.log(`Performing ${searchType} search for CNR: ${cnr}`);

    console.log(`Request details:`, {
      endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token.substring(0, 20)}...`, // Updated log to match actual header
      },
      body
    });

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Accept': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Search request failed: ${response.status} ${response.statusText}`);
      console.error('Error response body:', errorText);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return { 
        success: false, 
        error: `Search failed: ${response.status} ${response.statusText} - ${errorText}`,
        data: null 
      };
    }

    const data = await response.json();
    console.log(`Search completed for ${searchType}, CNR: ${cnr}`);
    console.log('API Response data:', JSON.stringify(data, null, 2));

    // Check if LegalKart API returned success in the response body
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      console.warn('LegalKart API returned success: false in response body');
      return { 
        success: false, 
        error: data.error || data.message || 'Case not found in LegalKart API',
        data: null 
      };
    }

    // Check if data is empty or null
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      console.warn('LegalKart API returned empty data');
      return { 
        success: false, 
        error: 'No case data found for the provided CNR',
        data: null 
      };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error(`Search error for ${searchType}:`, error);
    return { 
      success: false, 
      error: `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null 
    };
  }
}

async function getGujaratDisplayBoard(token: string) {
  try {
    console.log('Fetching Gujarat Display Board...');

    const response = await fetch('https://apiservices.legalkart.com/api/v1/application-service/case-search/display-board/gujarat', {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Display board request failed: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        error: `Display board fetch failed: ${response.status} ${response.statusText}`,
        data: null 
      };
    }

    const data = await response.json();
    console.log('Gujarat Display Board fetched successfully');

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Display board error:', error);
    return { 
      success: false, 
      error: `Display board error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null 
    };
  }
}

// Enhanced Legalkart data mapping function - maps 50+ fields comprehensively
function mapLegalkartDataToCRM(data: any, searchType: string = 'unknown'): any {
  if (!data || typeof data !== 'object') {
    return null;
  }

  console.log(`Mapping ${searchType} data:`, JSON.stringify(data, null, 2));

  // Base mapping object
  const mappedData: any = {
    fetched_data: data,
    is_auto_fetched: true,
    fetch_status: 'success',
    fetch_message: `Data fetched from ${searchType} on ${new Date().toISOString()}`,
    last_fetched_at: new Date().toISOString(),
  };

  // Helper functions for data processing
  const parseDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      const raw = dateStr.toString().trim();
      const lower = raw.toLowerCase();
      const nullTokens = new Set(['', '-', '--', '—', '#', 'n/a', 'na', 'nil', 'null', 'undefined']);
      if (nullTokens.has(lower)) return null;

      // DD/MM/YYYY
      if (raw.includes('/')) {
        const [day, month, year] = raw.split('/');
        if (year && month && day) return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
      }
      // DD-MM-YYYY or DD.MM.YYYY
      if ((raw.includes('-') || raw.includes('.')) && raw.split(/[\-.]/)[0].length === 2) {
        const [day, month, year] = raw.split(/[\-.]/);
        if (year && month && day) return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
      }
      // Formats like "19th November 2025"
      if (/(th|st|nd|rd)\s/i.test(raw) || /[A-Za-z]/.test(raw)) {
        const monthMap: { [key: string]: string } = {
          'january': '01', 'february': '02', 'march': '03', 'april': '04',
          'may': '05', 'june': '06', 'july': '07', 'august': '08',
          'september': '09', 'october': '10', 'november': '11', 'december': '12',
          'jan': '01','feb': '02','mar': '03','apr': '04','jun': '06','jul': '07','aug': '08','sep': '09','sept': '09','oct': '10','nov': '11','dec': '12'
        };
        const cleaned = raw.toLowerCase().replace(/(\d+)(th|st|nd|rd)/, '$1').replace(/\./g,'');
        const parts = cleaned.split(/\s+/);
        if (parts.length >= 3) {
          const day = parts[0].padStart(2,'0');
          const mon = monthMap[parts[1]];
          const year = parts[2];
          if (mon && /^(19|20)\d{2}$/.test(year)) return `${year}-${mon}-${day}`;
        }
      }
      // ISO with time
      if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0,10);
      // ISO date
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
      return null;
    } catch {
      return null;
    }
  };

  const cleanText = (text: string | null | undefined): string | null => {
    if (!text) return null;
    return text.toString().trim().replace(/\s+/g, ' ');
  };

  const extractArrayFromString = (str: string | string[] | null | undefined): string[] => {
    if (!str) return [];
    if (Array.isArray(str)) return str.filter(Boolean);
    return str.toString().split(',').map(s => s.trim()).filter(Boolean);
  };

  // Parse party information from Legalkart format
  const parsePartyInfo = (partyStr: string): { name: string; advocate: string } => {
    if (!partyStr) return { name: '', advocate: '' };
    
    // Remove numbering like "1)" or "2)"
    let cleaned = partyStr.replace(/^\d+\)\s*/, '').trim();
    
    // Handle multiple advocate formats:
    // "Advocate-", "Advocate -", "Advocate - ", "Advocate ("
    const advocateMatch = cleaned.match(/^(.*?)\s+Advocate[\s\-\(]+(.*)$/i);
    
    if (advocateMatch) {
      const name = advocateMatch[1].trim();
      const advocate = advocateMatch[2]
        .replace(/^\s*-\s*/, '') // Remove leading dash
        .replace(/\(.*$/, '')     // Remove anything in parentheses
        .replace(/\d+\).*$/, '')  // Remove trailing number references like "2)"
        .trim();
      return { name, advocate };
    }
    
    // If no advocate pattern found, return the cleaned name
    return { name: cleaned, advocate: '' };
  };

  // Extract data from nested Legalkart response structure
  // District courts use data.case_details, data.case_status_details, etc.
  const rd = data.data ?? data ?? {};
  const caseDetails = rd.case_details || rd.case_info || {};
  const caseInfo = caseDetails; // Alias for backward compatibility
  const caseStatus = rd.case_status || rd.case_status_details || {};
  const categoryInfo = rd.category_info || {};
  const hearingHistory = rd.history_of_case_hearing || rd.case_history || [];
  const orderDetails = rd.order_details || [];
  const documents = rd.documents || [];
  const objections = rd.objections || [];
  const iaDetails = rd.ia_details || [];
  const actsAndSections = rd.acts_and_sections_details || [];

  // BASIC CASE INFORMATION (15 fields)
  // District courts use data.case_details for basic info
  // Normalize CNR by removing hyphens and spaces
  const rawCnr = cleanText(
    caseDetails.cnr_number || 
    caseInfo.cnr_number || 
    rd.cnr_number || 
    data.cnr_number || 
    data.cnr || 
    data.CNR
  );
  mappedData.cnr_number = rawCnr ? rawCnr.replace(/[-\s]/g, '') : rawCnr;
  mappedData.case_number = cleanText(
    caseDetails.filing_number || 
    caseInfo.filing_number || 
    rd.filing_number || 
    data.case_number || 
    data.filing_number || 
    data.case_no
  );
  mappedData.filing_number = cleanText(
    caseDetails.filing_number || 
    caseInfo.filing_number || 
    rd.filing_number || 
    data.filing_number || 
    data.filing_no
  );
  mappedData.registration_number = cleanText(
    caseDetails.registration_number || 
    caseInfo.registration_number || 
    rd.registration_number || 
    data.registration_number || 
    data.reg_no
  );
  mappedData.docket_number = cleanText(data.docket_number || data.docket_no);

  // Nature of Disposal - for disposed cases (prioritize this for disposed status)
  mappedData.description = cleanText(
    data.nature_of_disposal || 
    data.natureOfDisposal ||
    data.disposal_nature ||
    caseStatus.nature_of_disposal ||
    data.description || 
    data.case_summary || 
    data.nature_of_case
  );
  mappedData.case_summary = cleanText(data.case_summary || data.summary);

  // COURT AND STATUS INFORMATION (12 fields)
  // District courts use court_heading for court name
  mappedData.court = cleanText(
    rd.court_heading || 
    caseStatus.court || 
    data.court || 
    data.court_name
  );
  mappedData.court_name = cleanText(
    rd.court_heading || 
    caseStatus.court || 
    data.court_name || 
    data.court
  );
  mappedData.court_type = cleanText(data.court_type || searchType.replace('_', ' '));
  mappedData.district = cleanText(caseStatus.district || data.district || data.district_name);
  mappedData.state = cleanText(caseStatus.state || data.state || data.state_name);
  mappedData.judicial_branch = cleanText(caseStatus.judicial_branch || data.judicial_branch);
  mappedData.bench_type = cleanText(caseStatus.bench_type || data.bench_type);
  mappedData.court_complex = cleanText(data.court_complex);
  mappedData.coram = cleanText(
    caseStatus.court_number_and_judge || 
    caseStatus.coram || 
    data.coram || 
    data.judge_name
  );
  mappedData.stage = cleanText(
    caseStatus.case_stage || 
    caseStatus.stage_of_case || 
    data.stage || 
    data.case_stage
  );

  // Status mapping based on eCourts data
  // pending: when eCourts returns pending/active/ongoing status
  // disposed: when eCourts returns disposed/dismissed/completed status
  // Note: 'open' is for cases NOT connected to LegalKart (set elsewhere)
  // Note: 'closed' is for manually closed cases (set by user action)
  if (data.status || data.case_status || caseStatus.stage_of_case || caseStatus.case_status) {
    const statusStr = (data.status || data.case_status || caseStatus.stage_of_case || caseStatus.case_status || '').toString().toLowerCase();
    const statusMapping: { [key: string]: string } = {
      'pending': 'pending', 'active': 'pending', 'ongoing': 'ongoing', 'listed': 'pending',
      'notice returnable': 'pending', 'adjourned': 'pending', 'admission': 'pending',
      'case disposed': 'disposed', 'disposed': 'disposed', 'dismissed': 'disposed', 'withdrawn': 'disposed', 
      'decided': 'disposed', 'completed': 'disposed', 'settled': 'disposed'
    };
    
    for (const [key, value] of Object.entries(statusMapping)) {
      if (statusStr.includes(key)) {
        mappedData.status = value;
        console.log(`✅ Case status mapped: "${statusStr}" → "${value}"`);
        break;
      }
    }
    // Default to 'pending' if we have LegalKart data but couldn't map the status
    if (!mappedData.status) {
      mappedData.status = 'pending';
      console.log(`⚠️ Could not map status "${statusStr}", defaulting to "pending"`);
    }
  }

  // PARTY INFORMATION (8 fields) - Enhanced parsing from Legalkart format
  // District courts use data.petitioner_and_respondent_details
  const petitionerAndRespondentDetails = rd.petitioner_and_respondent_details || {};
  
  // First extract the first party from strings that may contain multiple parties
  const extractFirstParty = (partyStr: string): string => {
    if (!partyStr) return '';
    // Split by patterns like "2)", "3)" to get only the first party
    const firstPartyMatch = partyStr.match(/^(1\).+?)(?=\s*\d+\)|$)/);
    return firstPartyMatch ? firstPartyMatch[1] : partyStr;
  };
  
  const petitionerStr = petitionerAndRespondentDetails.petitioner_and_advocate || 
                        rd.petitioner_and_advocate || 
                        data.petitioner_and_advocate || 
                        '';
  const respondentStr = petitionerAndRespondentDetails.respondent_and_advocate || 
                        rd.respondent_and_advocate || 
                        data.respondent_and_advocate || 
                        '';
  
  const petitionerInfo = parsePartyInfo(extractFirstParty(petitionerStr));
  const respondentInfo = parsePartyInfo(extractFirstParty(respondentStr));

  if (petitionerInfo.name) {
    mappedData.petitioner = cleanText(petitionerInfo.name);
    mappedData.petitioner_advocate = cleanText(petitionerInfo.advocate);
  }

  if (respondentInfo.name) {
    mappedData.respondent = cleanText(respondentInfo.name);
    mappedData.respondent_advocate = cleanText(respondentInfo.advocate);
  }

  // Construct vs field intelligently
  if (mappedData.petitioner && mappedData.respondent) {
    mappedData.vs = `${mappedData.petitioner} vs ${mappedData.respondent}`;
  }
  
  // Case title derivation - intelligent construction AFTER parsing parties
  // Format: "FirstPetitioner Vs FirstRespondent"
  mappedData.case_title = cleanText(
    data.case_title || 
    data.data?.case_title ||
    data.title || 
    data.data?.title ||
    data.matter_title ||
    data.data?.matter_title ||
    (mappedData.petitioner && mappedData.respondent ? `${mappedData.petitioner} Vs ${mappedData.respondent}` : null) ||
    (data.petitioner && data.respondent ? `${data.petitioner} Vs ${data.respondent}` : null) ||
    (data.data?.petitioner && data.data?.respondent ? `${data.data.petitioner} Vs ${data.data.respondent}` : null) ||
    `Case ${mappedData.case_number || mappedData.cnr_number || 'Unknown'}`
  );
  
  // Primary advocate selection
  mappedData.advocate_name = cleanText(
    mappedData.petitioner_advocate || 
    data.advocate_name || 
    data.counsel_name
  );

  // Store detailed party information
  if (petitionerInfo.name || respondentInfo.name) {
    mappedData.party_details = {
      petitioner: mappedData.petitioner,
      respondent: mappedData.respondent,
      petitioner_advocate: mappedData.petitioner_advocate,
      respondent_advocate: mappedData.respondent_advocate,
      raw_petitioner_string: petitionerAndRespondentDetails.petitioner_and_advocate || rd.petitioner_and_advocate || data.petitioner_and_advocate,
      raw_respondent_string: petitionerAndRespondentDetails.respondent_and_advocate || rd.respondent_and_advocate || data.respondent_and_advocate
    };
  }

  // DATE INFORMATION (8 fields) - Comprehensive date parsing, support district court case_details and case_status_details
  const caseStatusDetails = rd.case_status_details || {};
  
  mappedData.filing_date = parseDate(
    caseDetails.filing_date || 
    caseInfo.filing_date || 
    data.filing_date || 
    data.date_of_filing
  );
  mappedData.registration_date = parseDate(
    caseDetails.registration_date || 
    caseInfo.registration_date || 
    data.registration_date || 
    data.date_of_registration
  );
  mappedData.first_hearing_date = parseDate(
    caseStatusDetails.first_hearing_date || 
    caseStatus.first_hearing_date || 
    caseDetails.first_hearing_date || 
    data.first_hearing_date || 
    data.first_listing_date
  );
  mappedData.next_hearing_date = parseDate(
    caseStatusDetails.next_hearing_date || 
    caseStatus.next_hearing_date || 
    caseDetails.next_hearing_date || 
    data.next_hearing_date || 
    data.next_date
  );
  mappedData.listed_date = parseDate(
    caseDetails.listed_date || 
    data.listed_date || 
    data.listing_date
  );
  mappedData.disposal_date = parseDate(
    caseStatus.disposal_date ||
    caseDetails.disposal_date || 
    data.disposal_date || 
    data.date_of_disposal
  );
  mappedData.decision_date = parseDate(
    caseStatus.decision_date ||
    caseDetails.decision_date || 
    data.decision_date || 
    data.judgment_date
  );
  mappedData.scrutiny_date = parseDate(
    caseDetails.scrutiny_date || 
    objections[0]?.scrutiny_date || 
    data.scrutiny_date
  );

  // Nature of Disposal - for disposed cases
  mappedData.description = cleanText(
    data.nature_of_disposal || 
    data.natureOfDisposal ||
    data.disposal_nature ||
    caseStatus.nature_of_disposal ||
    data.description || 
    data.case_summary || 
    data.nature_of_case
  );

  // CATEGORY AND CLASSIFICATION (6 fields)
  mappedData.category = cleanText(categoryInfo.category || data.category || data.case_category);
  mappedData.sub_category = cleanText(categoryInfo.sub_category || data.sub_category || data.case_sub_category);
  mappedData.case_classification = cleanText(data.case_classification || data.classification);
  mappedData.case_sub_type = cleanText(data.case_sub_type || data.sub_type);
  mappedData.business_type = cleanText(data.business_type);
  mappedData.matter_type = cleanText(data.matter_type || data.nature_of_case);

  // Case type intelligent mapping from category or case_details
  // Note: Database enum supports: civil, criminal, family, other
  const caseTypeField = caseDetails.case_type || categoryInfo.category || data.case_type;
  if (caseTypeField) {
    const categoryStr = caseTypeField.toString().toLowerCase();
    if (categoryStr.includes('criminal')) mappedData.case_type = 'criminal';
    else if (categoryStr.includes('family') || categoryStr.includes('fsuit')) mappedData.case_type = 'family';
    else if (categoryStr.includes('civil') || categoryStr.includes('commercial')) mappedData.case_type = 'civil';
    else mappedData.case_type = 'other';
  }

  // LEGAL FRAMEWORK (5 fields) - Extract from category info or acts_and_sections_details
  const extractedActs: string[] = [];
  const extractedSections: string[] = [];
  
  // District courts provide acts_and_sections_details array
  if (actsAndSections && Array.isArray(actsAndSections) && actsAndSections.length > 0) {
    actsAndSections.forEach((item: any) => {
      if (item.under_act) extractedActs.push(cleanText(item.under_act)!);
      if (item.under_section) extractedSections.push(cleanText(item.under_section)!);
    });
  }
  
  if (categoryInfo.category?.includes('BHARATIYA NAGARIK SURAKSHA SANHITA')) {
    extractedActs.push('Bharatiya Nagarik Suraksha Sanhita, 2023');
  }
  
  mappedData.acts = extractedActs.length > 0 ? extractedActs : extractArrayFromString(data.acts || data.under_acts);
  mappedData.sections = extractedSections.length > 0 ? extractedSections : extractArrayFromString(data.sections || data.under_sections);
  mappedData.under_act = extractedActs.length > 0 ? extractedActs[0] : cleanText(data.under_act || data.act);
  mappedData.under_section = extractedSections.length > 0 ? extractedSections.join(', ') : cleanText(data.under_section || data.section);

  // ORDERS AND PROCEEDINGS (4 fields) - support LegalKart formats
  const extractedOrders = orderDetails
    .filter((order: any) => order.purpose_of_hearing && order.purpose_of_hearing !== 'Order Details')
    .map((order: any) => `${order.hearing_date}: ${order.purpose_of_hearing}`);
  
  // Check for LegalKart final_orders and interim_orders arrays directly
  const finalOrdersArr = Array.isArray(data.final_orders) ? data.final_orders 
    : Array.isArray(data.data?.final_orders) ? data.data.final_orders : [];
  const interimOrdersArr = Array.isArray(data.interim_orders) ? data.interim_orders 
    : Array.isArray(data.data?.interim_orders) ? data.data.interim_orders : [];
  
  mappedData.orders = extractedOrders.length > 0 ? extractedOrders : extractArrayFromString(data.orders || data.court_orders);
  mappedData.interim_orders = interimOrdersArr.length > 0 ? interimOrdersArr : extractArrayFromString(data.interim_orders);
  mappedData.final_orders = finalOrdersArr.length > 0 ? finalOrdersArr : extractArrayFromString(data.final_orders);
  
  // HEARING AND LISTING (6 fields)
  if (hearingHistory.length > 0) {
    const latestHearing = hearingHistory[0];
    mappedData.cause_list_type = cleanText(latestHearing.cause_list_type);
    mappedData.purpose_of_hearing = cleanText(latestHearing.purpose_of_hearing);
    mappedData.listing_reason = cleanText(data.listing_reason);
    mappedData.urgent_listing = Boolean(data.urgent_listing || data.is_urgent);
  }

  mappedData.hearing_notes = cleanText(data.hearing_notes || data.notes);

  // Store complete hearing history - support LegalKart case_history format (district courts)
  if (hearingHistory.length > 0) {
    mappedData.hearing_history = hearingHistory;
  }

  // DOCUMENT AND PROCESS (4 fields)
  const documentLinks = documents
    .filter((doc: any) => doc.document_filed)
    .map((doc: any) => `${doc.document_filed} (Filed: ${doc.date_of_receiving})`);
  
  mappedData.document_links = documentLinks.length > 0 ? documentLinks : extractArrayFromString(data.document_links || data.documents);
  
  // Process objections
  const objectionTexts = objections
    .filter((obj: any) => obj.objection && obj.objection.trim())
    .map((obj: any) => obj.objection);
  
  if (objectionTexts.length > 0) {
    mappedData.objection = objectionTexts.join('; ');
    mappedData.objection_status = objections[0]?.objection_compliance_date ? 'Complied' : 'Pending';
  }

  // IA applications
  const iaNumbers = iaDetails
    .filter((ia: any) => ia.ia_number && !ia.ia_number.includes('Classification'))
    .map((ia: any) => ia.ia_number);
  
  mappedData.ia_numbers = iaNumbers.length > 0 ? iaNumbers : extractArrayFromString(data.ia_numbers || data.ia_applications);

  if (documents.length > 0) {
    mappedData.document_history = documents;
  }

  // CASE CONNECTIONS (2 fields)
  mappedData.connected_cases = extractArrayFromString(data.connected_cases || data.related_cases);
  mappedData.filing_party = cleanText(mappedData.petitioner || data.filing_party);

  // Priority assessment based on case urgency, type, and stage
  if (mappedData.case_type === 'criminal' || mappedData.urgent_listing) {
    mappedData.priority = 'high';
  } else if (mappedData.interim_orders?.length > 0 || mappedData.orders?.length > 0) {
    mappedData.priority = 'medium';
  } else {
    mappedData.priority = 'low';
  }

  // Log mapping statistics
  const mappedFields = Object.keys(mappedData).filter(key => 
    mappedData[key] !== null && mappedData[key] !== undefined && mappedData[key] !== '' && 
    !(Array.isArray(mappedData[key]) && mappedData[key].length === 0)
  );
  console.log(`Successfully mapped ${mappedFields.length} fields for ${searchType}:`, mappedFields);

  return mappedData;
}