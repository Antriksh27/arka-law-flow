import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (!legalkartUserId || !legalkartHashKey) {
      console.error('Legalkart credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Legalkart credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client (service role) and verify user from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get current user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's firm
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('firm_id, role')
      .eq('user_id', user.id)
      .single();

    if (!teamMember) {
      console.error('User not found in team members');
      return new Response(
        JSON.stringify({ error: 'User not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const { action } = requestBody;

    if (action === 'authenticate') {
      // Authenticate with Legalkart API
      const authResult = await authenticateWithLegalkart(legalkartUserId, legalkartHashKey);
      
      return new Response(JSON.stringify(authResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search') {
      const { cnr, searchType, caseId }: LegalkartCaseSearchRequest = requestBody;
      
      if (!cnr || !searchType) {
        return new Response(
          JSON.stringify({ error: 'CNR and search type are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Starting Legalkart search for CNR: ${cnr}, Type: ${searchType}`);
      
      // Normalize CNR: remove hyphens and spaces before searching
      const normalizedCnr = cnr.replace(/[-\s]/g, '');
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

      // Create search record
      const { data: searchRecord, error: insertError } = await supabase
        .from('legalkart_case_searches')
        .insert({
          firm_id: teamMember.firm_id,
          case_id: caseId || null,
          cnr_number: normalizedCnr, // Store normalized CNR
          search_type: searchType,
          request_data: { cnr, searchType },
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating search record:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create search record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Perform the search using normalized CNR
      const searchResult = await performCaseSearch(authResult.token, normalizedCnr, searchType);

      // Update search record with results
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

      // Update case with fetched data if successful and case_id provided
      if (searchResult.success && caseId && searchResult.data) {
        const mappedData = mapLegalkartDataToCRM(searchResult.data, searchType);
        
        // Update main cases table
        const { error: caseUpdateError } = await supabase
          .from('cases')
          .update({
            ...mappedData,
            last_fetched_at: new Date().toISOString(),
            fetched_data: searchResult.data,
          })
          .eq('id', caseId);

        if (caseUpdateError) {
          console.error('Error updating case with fetched data:', caseUpdateError);
        }

        // Insert/update data in legalkart_cases table and related tables
        try {
          console.log('Calling upsert_legalkart_case_data function...');

          // Sanitize and normalize dates to ISO (yyyy-mm-dd) to prevent Postgres datestyle errors
          const rawData: any = (searchResult as any).data?.data || (searchResult as any).data;

          // Helpers to normalize common date formats from Legalkart
          const monthIndex: Record<string, string> = {
            january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
            july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
          };
          const stripOrdinals = (s: string) => s.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1');
          const cleanup = (s: string) => s.replace(/\(.*?\)/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
          const normalizeDate = (val: unknown): string | null => {
            if (typeof val !== 'string') return null;
            if (!val || val.trim() === '') return null;
            let s = cleanup(val);
            
            // dd-mm-yyyy or dd/mm/yyyy
            const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
            if (m) {
              const dd = m[1].padStart(2, '0');
              const mm = m[2].padStart(2, '0');
              const yyyy = m[3];
              return `${yyyy}-${mm}-${dd}`;
            }
            
            // dd Month yyyy (with or without ordinals)
            s = stripOrdinals(s);
            const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
            if (m2) {
              const dd = m2[1].padStart(2, '0');
              const mon = monthIndex[m2[2].toLowerCase()];
              const yyyy = m2[3];
              if (mon) return `${yyyy}-${mon}-${dd}`;
            }
            
            // If already in ISO format (yyyy-mm-dd), return as-is
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            
            return null;
          };
          
          const normalizeDatesDeep = (input: any): any => {
            if (Array.isArray(input)) return input.map(normalizeDatesDeep);
            if (input && typeof input === 'object') {
              const out: any = {};
              for (const [k, v] of Object.entries(input)) {
                if (typeof v === 'string') {
                  if (/date/i.test(k)) {
                    const iso = normalizeDate(v);
                    out[k] = iso; // force null for empty/invalid date strings
                  } else {
                    out[k] = v;
                  }
                } else {
                  out[k] = normalizeDatesDeep(v);
                }
              }
              return out;
            }
            return input;
          };

          const documents = Array.isArray(rawData?.documents) ? rawData.documents : [];
          const objections = Array.isArray(rawData?.objections) ? rawData.objections : [];

          const rawOrders = Array.isArray(rawData?.order_details) ? rawData.order_details : [];
          const sanitizedOrders = rawOrders
            .filter((o: any) => o && typeof o === 'object')
            .map((o: any) => {
              const normalized = normalizeDatesDeep({
                ...o,
                hearing_date: normalizeDate(o.hearing_date) ?? o.hearing_date,
                order_date: normalizeDate((o as any).order_date) ?? (o as any).order_date,
              });
              // Explicitly extract PDF fields with multiple fallback patterns
              return {
                ...normalized,
                pdf_base64: o.pdf_base64 || o.pdfBase64 || o.base64Pdf || o.base64 || null,
                order_link: o.order_link || o.orderLink || o.link || o.url || o.pdf_url || null,
              };
            })
            .filter((o: any) => !o.hearing_date || /^\d{4}-\d{2}-\d{2}$/.test(String(o.hearing_date)));

          const rawHistory = Array.isArray(rawData?.history_of_case_hearing) ? rawData.history_of_case_hearing : [];
          const sanitizedHistory = rawHistory
            .filter((h: any) => h && typeof h === 'object')
            .map((h: any) => normalizeDatesDeep({
              ...h,
              hearing_date: normalizeDate(h.hearing_date) ?? h.hearing_date,
              business_on_date: normalizeDate(h.business_on_date) ?? h.business_on_date,
            }));

          // Sanitize documents with explicit PDF field extraction
          const sanitizedDocuments = documents
            .filter((d: any) => d && typeof d === 'object')
            .map((d: any) => {
              const normalized = normalizeDatesDeep(d);
              // Explicitly extract PDF fields with multiple fallback patterns
              return {
                ...normalized,
                pdf_base64: d.pdf_base64 || d.pdfBase64 || d.base64Pdf || d.base64 || null,
                document_link: d.document_link || d.documentLink || d.link || d.url || d.pdf_url || null,
              };
            });

          const sanitizedObjections = objections
            .filter((o: any) => o && typeof o === 'object')
            .map((o: any) => normalizeDatesDeep(o));

          const caseDataSanitized = normalizeDatesDeep(rawData);

          // Log PDF data verification
          const docsWithPdf = sanitizedDocuments.filter(d => d.pdf_base64 || d.document_link).length;
          const ordersWithPdf = sanitizedOrders.filter(o => o.pdf_base64 || o.order_link).length;
          console.log('Sanitized counts -> docs:', sanitizedDocuments.length, 'objs:', sanitizedObjections.length, 'orders:', sanitizedOrders.length, 'history:', sanitizedHistory.length);
          console.log('PDF data check:');
          console.log('- Documents with PDF:', docsWithPdf, '/', sanitizedDocuments.length);
          console.log('- Orders with PDF:', ordersWithPdf, '/', sanitizedOrders.length);
          
          const { error: upsertError } = await supabase.rpc('upsert_legalkart_case_data', {
            p_cnr_number: normalizedCnr, // Use normalized CNR
            p_firm_id: teamMember.firm_id,
            p_case_id: caseId,
            p_case_data: caseDataSanitized,
            p_documents: sanitizedDocuments,
            p_objections: sanitizedObjections,
            p_orders: sanitizedOrders,
            p_history: sanitizedHistory,
          });

          if (upsertError) {
            console.error('Error upserting Legalkart case data:', upsertError);
          } else {
            console.log('Successfully upserted Legalkart case data');
          }
        } catch (upsertErr) {
          console.error('Failed to call upsert function:', upsertErr);
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
      const { cnrs }: { cnrs: string[] } = requestBody;
      
      if (!cnrs || !Array.isArray(cnrs) || cnrs.length === 0) {
        return new Response(
          JSON.stringify({ error: 'CNRs array is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
              created_by: user.id,
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
      // Handle DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD formats
      const cleanDate = dateStr.toString().trim();
      if (cleanDate.includes('/')) {
        const [day, month, year] = cleanDate.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      if (cleanDate.includes('-') && cleanDate.split('-')[0].length === 2) {
        const [day, month, year] = cleanDate.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Handle formats like "19th December 2025"
      if (cleanDate.includes('th ') || cleanDate.includes('st ') || cleanDate.includes('nd ') || cleanDate.includes('rd ')) {
        const monthMap: { [key: string]: string } = {
          'january': '01', 'february': '02', 'march': '03', 'april': '04',
          'may': '05', 'june': '06', 'july': '07', 'august': '08',
          'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        const parts = cleanDate.toLowerCase().replace(/(\d+)(th|st|nd|rd)/, '$1').split(' ');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = monthMap[parts[1]];
          const year = parts[2];
          if (month) return `${year}-${month}-${day}`;
        }
      }
      return new Date(cleanDate).toISOString().split('T')[0];
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
    
    // Handle format like "1) KOMALKANT FAKIRCHAND SHARMA Advocate- MR C B UPADHYAYA(3508)"
    const parts = partyStr.split('Advocate-');
    const name = parts[0]?.replace(/^\d+\)\s*/, '').trim() || '';
    const advocate = parts[1]?.trim() || '';
    
    return { name, advocate };
  };

  // Extract data from nested Legalkart response structure
  const caseInfo = data.data?.case_info || {};
  const caseStatus = data.data?.case_status || {};
  const categoryInfo = data.data?.category_info || {};
  const hearingHistory = data.data?.history_of_case_hearing || [];
  const orderDetails = data.data?.order_details || [];
  const documents = data.data?.documents || [];
  const objections = data.data?.objections || [];
  const iaDetails = data.data?.ia_details || [];

  // BASIC CASE INFORMATION (15 fields)
  mappedData.cnr_number = cleanText(caseInfo.cnr_number || data.cnr_number || data.cnr || data.CNR);
  mappedData.case_number = cleanText(caseInfo.filing_number || data.case_number || data.filing_number || data.case_no);
  mappedData.filing_number = cleanText(caseInfo.filing_number || data.filing_number || data.filing_no);
  mappedData.registration_number = cleanText(caseInfo.registration_number || data.registration_number || data.reg_no);
  mappedData.docket_number = cleanText(data.docket_number || data.docket_no);
  
  // Case title derivation - intelligent construction
  mappedData.case_title = cleanText(
    data.case_title || 
    data.title || 
    data.matter_title ||
    (data.petitioner && data.respondent ? `${data.petitioner} vs ${data.respondent}` : null) ||
    `Case ${mappedData.case_number || mappedData.cnr_number || 'Unknown'}`
  );

  mappedData.description = cleanText(data.description || data.case_summary || data.nature_of_case);
  mappedData.case_summary = cleanText(data.case_summary || data.summary);

  // COURT AND STATUS INFORMATION (12 fields)
  mappedData.court = cleanText(caseStatus.court || data.court || data.court_name);
  mappedData.court_name = cleanText(caseStatus.court || data.court_name || data.court);
  mappedData.court_type = cleanText(data.court_type || searchType.replace('_', ' '));
  mappedData.district = cleanText(caseStatus.district || data.district || data.district_name);
  mappedData.state = cleanText(caseStatus.state || data.state || data.state_name);
  mappedData.judicial_branch = cleanText(caseStatus.judicial_branch || data.judicial_branch);
  mappedData.bench_type = cleanText(caseStatus.bench_type || data.bench_type);
  mappedData.court_complex = cleanText(data.court_complex);
  mappedData.coram = cleanText(caseStatus.coram || data.coram || data.judge_name);
  mappedData.stage = cleanText(caseStatus.stage_of_case || data.stage || data.case_stage);

  // Status mapping with intelligence
  if (data.status || data.case_status || caseStatus.stage_of_case) {
    const statusStr = (data.status || data.case_status || caseStatus.stage_of_case || '').toString().toLowerCase();
    const statusMapping: { [key: string]: string } = {
      'pending': 'open', 'active': 'open', 'ongoing': 'open', 'listed': 'open',
      'notice returnable': 'open', 'adjourned': 'open', 'admission': 'open',
      'disposed': 'closed', 'dismissed': 'closed', 'withdrawn': 'closed', 
      'decided': 'closed', 'completed': 'closed', 'settled': 'closed'
    };
    
    for (const [key, value] of Object.entries(statusMapping)) {
      if (statusStr.includes(key)) {
        mappedData.status = value;
        break;
      }
    }
    if (!mappedData.status) mappedData.status = 'open';
  }

  // PARTY INFORMATION (8 fields) - Enhanced parsing from Legalkart format
  const petitionerInfo = parsePartyInfo(data.data?.petitioner_and_advocate || '');
  const respondentInfo = parsePartyInfo(data.data?.respondent_and_advocate || '');

  if (petitionerInfo.name) {
    mappedData.petitioner = cleanText(petitionerInfo.name);
    mappedData.petitioner_advocate = cleanText(petitionerInfo.advocate);
  }

  if (respondentInfo.name) {
    mappedData.respondent = cleanText(respondentInfo.name);
    mappedData.respondent_advocate = cleanText(respondentInfo.advocate);
  }

  // Handle multiple respondents (format: "1) STATE OF GUJARAT ... 2) CENTRAL BUREAU ...")
  if (data.data?.respondent_and_advocate?.includes('2)')) {
    const respondents = data.data.respondent_and_advocate.split(/\d+\)/).filter(Boolean);
    if (respondents.length > 1) {
      const firstRespondent = parsePartyInfo(respondents[0]);
      mappedData.respondent = cleanText(firstRespondent.name);
      mappedData.respondent_advocate = cleanText(firstRespondent.advocate);
    }
  }
  
  // Construct vs field intelligently
  if (mappedData.petitioner && mappedData.respondent) {
    mappedData.vs = `${mappedData.petitioner} vs ${mappedData.respondent}`;
  }
  
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
      raw_petitioner_string: data.data?.petitioner_and_advocate,
      raw_respondent_string: data.data?.respondent_and_advocate
    };
  }

  // DATE INFORMATION (8 fields) - Comprehensive date parsing
  mappedData.filing_date = parseDate(caseInfo.filing_date || data.filing_date || data.date_of_filing);
  mappedData.registration_date = parseDate(caseInfo.registration_date || data.registration_date || data.date_of_registration);
  mappedData.first_hearing_date = parseDate(data.first_hearing_date || data.first_listing_date);
  mappedData.next_hearing_date = parseDate(caseStatus.next_hearing_date || data.next_hearing_date || data.next_date);
  mappedData.listed_date = parseDate(data.listed_date || data.listing_date);
  mappedData.disposal_date = parseDate(data.disposal_date || data.date_of_disposal);
  mappedData.decision_date = parseDate(data.decision_date || data.judgment_date);
  mappedData.scrutiny_date = parseDate(objections[0]?.scrutiny_date || data.scrutiny_date);

  // CATEGORY AND CLASSIFICATION (6 fields)
  mappedData.category = cleanText(categoryInfo.category || data.category || data.case_category);
  mappedData.sub_category = cleanText(categoryInfo.sub_category || data.sub_category || data.case_sub_category);
  mappedData.case_classification = cleanText(data.case_classification || data.classification);
  mappedData.case_sub_type = cleanText(data.case_sub_type || data.sub_type);
  mappedData.business_type = cleanText(data.business_type);
  mappedData.matter_type = cleanText(data.matter_type || data.nature_of_case);

  // Case type intelligent mapping from category
  if (categoryInfo.category || data.case_type) {
    const categoryStr = (categoryInfo.category || data.case_type || '').toString().toLowerCase();
    if (categoryStr.includes('criminal')) mappedData.case_type = 'criminal';
    else if (categoryStr.includes('civil')) mappedData.case_type = 'civil';
    else if (categoryStr.includes('commercial')) mappedData.case_type = 'commercial';
    else if (categoryStr.includes('family')) mappedData.case_type = 'family';
    else mappedData.case_type = 'civil';
  }

  // LEGAL FRAMEWORK (5 fields) - Extract from category info
  const extractedActs: string[] = [];
  const extractedSections: string[] = [];
  
  if (categoryInfo.category?.includes('BHARATIYA NAGARIK SURAKSHA SANHITA')) {
    extractedActs.push('Bharatiya Nagarik Suraksha Sanhita, 2023');
  }
  
  mappedData.acts = extractedActs.length > 0 ? extractedActs : extractArrayFromString(data.acts || data.under_acts);
  mappedData.sections = extractedSections.length > 0 ? extractedSections : extractArrayFromString(data.sections || data.under_sections);
  mappedData.under_act = cleanText(data.under_act || data.act);
  mappedData.under_section = cleanText(data.under_section || data.section);

  // ORDERS AND PROCEEDINGS (4 fields)
  const extractedOrders = orderDetails
    .filter((order: any) => order.purpose_of_hearing && order.purpose_of_hearing !== 'Order Details')
    .map((order: any) => `${order.hearing_date}: ${order.purpose_of_hearing}`);
  
  mappedData.orders = extractedOrders.length > 0 ? extractedOrders : extractArrayFromString(data.orders || data.court_orders);
  mappedData.interim_orders = extractArrayFromString(data.interim_orders);
  mappedData.final_orders = extractArrayFromString(data.final_orders);
  
  // HEARING AND LISTING (6 fields)
  if (hearingHistory.length > 0) {
    const latestHearing = hearingHistory[0];
    mappedData.cause_list_type = cleanText(latestHearing.cause_list_type);
    mappedData.purpose_of_hearing = cleanText(latestHearing.purpose_of_hearing);
    mappedData.listing_reason = cleanText(data.listing_reason);
    mappedData.urgent_listing = Boolean(data.urgent_listing || data.is_urgent);
  }

  mappedData.hearing_notes = cleanText(data.hearing_notes || data.notes);

  // Store complete hearing history
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