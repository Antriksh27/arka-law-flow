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
          cnr_number: cnr,
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

      // Perform the search
      const searchResult = await performCaseSearch(authResult.token, cnr, searchType);

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

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body,
    });

    if (!response.ok) {
      console.error(`Search request failed: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        error: `Search failed: ${response.status} ${response.statusText}`,
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

  // BASIC CASE INFORMATION (15 fields)
  mappedData.cnr_number = cleanText(data.cnr_number || data.cnr || data.CNR);
  mappedData.case_number = cleanText(data.case_number || data.filing_number || data.case_no);
  mappedData.filing_number = cleanText(data.filing_number || data.filing_no);
  mappedData.registration_number = cleanText(data.registration_number || data.reg_no);
  mappedData.docket_number = cleanText(data.docket_number || data.docket_no);
  
  // Case title derivation - intelligent construction
  if (!mappedData.case_title) {
    mappedData.case_title = cleanText(
      data.case_title || 
      data.title || 
      data.matter_title ||
      (data.petitioner && data.respondent ? `${data.petitioner} vs ${data.respondent}` : null) ||
      `Case ${mappedData.case_number || mappedData.cnr_number || 'Unknown'}`
    );
  }

  mappedData.description = cleanText(data.description || data.case_summary || data.nature_of_case);
  mappedData.case_summary = cleanText(data.case_summary || data.summary);

  // COURT AND STATUS INFORMATION (12 fields)
  mappedData.court = cleanText(data.court || data.court_name);
  mappedData.court_name = cleanText(data.court_name || data.court);
  mappedData.court_type = cleanText(data.court_type || searchType.replace('_', ' '));
  mappedData.district = cleanText(data.district || data.district_name);
  mappedData.state = cleanText(data.state || data.state_name);
  mappedData.judicial_branch = cleanText(data.judicial_branch);
  mappedData.bench_type = cleanText(data.bench_type);
  mappedData.court_complex = cleanText(data.court_complex);
  mappedData.coram = cleanText(data.coram || data.judge_name);
  mappedData.stage = cleanText(data.stage || data.case_stage);

  // Status mapping with intelligence
  if (data.status || data.case_status) {
    const statusStr = (data.status || data.case_status).toString().toLowerCase();
    const statusMapping: { [key: string]: string } = {
      'pending': 'open', 'active': 'open', 'ongoing': 'open', 'listed': 'open',
      'disposed': 'closed', 'dismissed': 'closed', 'withdrawn': 'closed', 
      'decided': 'closed', 'completed': 'closed', 'settled': 'closed'
    };
    mappedData.status = statusMapping[statusStr] || 'open';
  }

  // PARTY INFORMATION (8 fields) - Enhanced parsing
  if (data.petitioner || data.parties?.petitioner) {
    mappedData.petitioner = cleanText(data.petitioner || data.parties?.petitioner);
  }
  if (data.respondent || data.parties?.respondent) {
    mappedData.respondent = cleanText(data.respondent || data.parties?.respondent);
  }
  if (data.petitioner_advocate || data.parties?.petitioner_advocate) {
    mappedData.petitioner_advocate = cleanText(data.petitioner_advocate || data.parties?.petitioner_advocate);
  }
  if (data.respondent_advocate || data.parties?.respondent_advocate) {
    mappedData.respondent_advocate = cleanText(data.respondent_advocate || data.parties?.respondent_advocate);
  }
  
  // Handle string-based parties like "A vs B"
  if (data.parties && typeof data.parties === 'string') {
    const parties = data.parties.split(' vs ');
    if (parties.length >= 2) {
      mappedData.petitioner = cleanText(parties[0]);
      mappedData.respondent = cleanText(parties[1]);
    }
  }
  
  // Construct vs field intelligently
  if (mappedData.petitioner && mappedData.respondent) {
    mappedData.vs = `${mappedData.petitioner} vs ${mappedData.respondent}`;
  }
  
  // Primary advocate selection
  mappedData.advocate_name = cleanText(
    data.advocate_name || 
    data.petitioner_advocate || 
    data.parties?.petitioner_advocate ||
    data.counsel_name
  );

  // Store detailed party information
  if (data.parties || mappedData.petitioner || mappedData.respondent) {
    mappedData.party_details = {
      petitioner: mappedData.petitioner,
      respondent: mappedData.respondent,
      petitioner_advocate: mappedData.petitioner_advocate,
      respondent_advocate: mappedData.respondent_advocate,
      other_parties: data.parties?.others || [],
      advocate_details: data.advocate_details || {}
    };
  }

  // DATE INFORMATION (8 fields) - Comprehensive date parsing
  mappedData.filing_date = parseDate(data.filing_date || data.date_of_filing);
  mappedData.registration_date = parseDate(data.registration_date || data.date_of_registration);
  mappedData.first_hearing_date = parseDate(data.first_hearing_date || data.first_listing_date);
  mappedData.next_hearing_date = parseDate(data.next_hearing_date || data.next_date);
  mappedData.listed_date = parseDate(data.listed_date || data.listing_date);
  mappedData.disposal_date = parseDate(data.disposal_date || data.date_of_disposal);
  mappedData.decision_date = parseDate(data.decision_date || data.judgment_date);
  mappedData.scrutiny_date = parseDate(data.scrutiny_date);
  mappedData.complaint_date = parseDate(data.complaint_date || data.fir_date);

  // CATEGORY AND CLASSIFICATION (6 fields)
  mappedData.category = cleanText(data.category || data.case_category);
  mappedData.sub_category = cleanText(data.sub_category || data.case_sub_category);
  mappedData.case_classification = cleanText(data.case_classification || data.classification);
  mappedData.case_sub_type = cleanText(data.case_sub_type || data.sub_type);
  mappedData.business_type = cleanText(data.business_type);
  mappedData.matter_type = cleanText(data.matter_type || data.nature_of_case);

  // Case type intelligent mapping
  if (data.case_type || data.type) {
    const typeMapping: { [key: string]: string } = {
      'civil': 'civil', 'criminal': 'criminal', 'commercial': 'commercial',
      'family': 'family', 'labour': 'labour', 'constitutional': 'constitutional',
      'tax': 'tax', 'corporate': 'corporate'
    };
    const typeStr = (data.case_type || data.type).toString().toLowerCase();
    mappedData.case_type = typeMapping[typeStr] || 'civil';
  }

  // LEGAL FRAMEWORK (5 fields)
  mappedData.acts = extractArrayFromString(data.acts || data.under_acts);
  mappedData.sections = extractArrayFromString(data.sections || data.under_sections);
  mappedData.under_act = cleanText(data.under_act || data.act);
  mappedData.under_section = cleanText(data.under_section || data.section);

  // ORDERS AND PROCEEDINGS (4 fields)
  mappedData.orders = extractArrayFromString(data.orders || data.court_orders);
  mappedData.interim_orders = extractArrayFromString(data.interim_orders);
  mappedData.final_orders = extractArrayFromString(data.final_orders);
  
  // CRIMINAL CASE SPECIFIC (4 fields)
  mappedData.police_station = cleanText(data.police_station || data.ps);
  mappedData.fir_number = cleanText(data.fir_number || data.fir_no);
  mappedData.police_district = cleanText(data.police_district);

  // HEARING AND LISTING (6 fields)
  mappedData.cause_list_type = cleanText(data.cause_list_type || data.list_type);
  mappedData.purpose_of_hearing = cleanText(data.purpose_of_hearing || data.hearing_purpose);
  mappedData.listing_reason = cleanText(data.listing_reason);
  mappedData.urgent_listing = Boolean(data.urgent_listing || data.is_urgent);
  mappedData.hearing_notes = cleanText(data.hearing_notes || data.notes);

  // Store hearing history if available
  if (data.hearing_history || data.hearings) {
    mappedData.hearing_history = data.hearing_history || data.hearings;
  }

  // DOCUMENT AND PROCESS (4 fields)
  mappedData.document_links = extractArrayFromString(data.document_links || data.documents);
  mappedData.objection = cleanText(data.objection || data.objection_details);
  mappedData.objection_status = cleanText(data.objection_status);
  mappedData.ia_numbers = extractArrayFromString(data.ia_numbers || data.ia_applications);

  if (data.document_history || data.document_details) {
    mappedData.document_history = data.document_history || data.document_details;
  }

  // CASE CONNECTIONS (2 fields)
  mappedData.connected_cases = extractArrayFromString(data.connected_cases || data.related_cases);
  mappedData.filing_party = cleanText(data.filing_party);

  // Priority assessment based on case urgency, type, and stage
  if (!mappedData.priority) {
    if (mappedData.urgent_listing || (mappedData.case_type === 'criminal' && mappedData.stage?.includes('bail'))) {
      mappedData.priority = 'high';
    } else if (mappedData.case_type === 'commercial' || mappedData.interim_orders?.length > 0) {
      mappedData.priority = 'medium';
    } else {
      mappedData.priority = 'low';
    }
  }

  // Log mapping statistics
  const mappedFields = Object.keys(mappedData).filter(key => 
    mappedData[key] !== null && mappedData[key] !== undefined && mappedData[key] !== ''
  );
  console.log(`Successfully mapped ${mappedFields.length} fields for ${searchType}:`, mappedFields);

  return mappedData;
}