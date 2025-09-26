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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const legalkartUserId = Deno.env.get('LEGALKART_USER_ID');
    const legalkartHashKey = Deno.env.get('LEGALKART_HASH_KEY');

    if (!legalkartUserId || !legalkartHashKey) {
      console.error('Legalkart credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Legalkart credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!,
        },
      },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
        const mappedData = mapLegalkartDataToCRM(searchResult.data);
        
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
    
    const response = await fetch('https://apiservices.legalkart.com/api/v1/application-service/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        hash_key: hashKey,
      }),
    });

    if (!response.ok) {
      console.error('Authentication request failed:', response.status, response.statusText);
      return { 
        success: false, 
        error: `Authentication failed: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    console.log('Authentication response received');

    if (data.token) {
      return { success: true, token: data.token };
    } else {
      return { 
        success: false, 
        error: data.message || 'No token received from authentication' 
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

function mapLegalkartDataToCRM(legalkartData: any) {
  // Map Legalkart response fields to CRM case fields
  const mappedData: any = {};

  if (legalkartData.case_number) {
    mappedData.case_number = legalkartData.case_number;
  }

  if (legalkartData.case_status) {
    // Map status to CRM status enum
    const statusMapping: Record<string, string> = {
      'active': 'open',
      'disposed': 'closed',
      'pending': 'open',
    };
    mappedData.status = statusMapping[legalkartData.case_status.toLowerCase()] || 'open';
  }

  if (legalkartData.next_hearing_date) {
    mappedData.next_hearing_date = legalkartData.next_hearing_date;
  }

  if (legalkartData.parties) {
    // Map parties to petitioner/respondent fields
    if (typeof legalkartData.parties === 'string') {
      const parties = legalkartData.parties.split(' vs ');
      if (parties.length >= 2) {
        mappedData.petitioner = parties[0].trim();
        mappedData.respondent = parties[1].trim();
      }
    } else if (Array.isArray(legalkartData.parties)) {
      mappedData.petitioner = legalkartData.parties[0]?.name || null;
      mappedData.respondent = legalkartData.parties[1]?.name || null;
    }
  }

  if (legalkartData.orders && Array.isArray(legalkartData.orders)) {
    mappedData.orders = legalkartData.orders;
  }

  // Additional field mappings
  if (legalkartData.court_name) {
    mappedData.court_name = legalkartData.court_name;
  }

  if (legalkartData.filing_date) {
    mappedData.filing_date = legalkartData.filing_date;
  }

  if (legalkartData.case_type) {
    mappedData.case_type = legalkartData.case_type;
  }

  return mappedData;
}