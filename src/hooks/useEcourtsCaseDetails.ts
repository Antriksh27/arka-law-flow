import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { fetchLegalkartCaseId } from '@/components/cases/ecourts_api/utils';

type EcourtsFunctionResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  error?: string;
};

const invokeEcourtsDirect = async <T = unknown>(body: Record<string, unknown>) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const supabaseClient = supabase as unknown as {
    functionsUrl?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  };

  const functionBaseUrl = supabaseClient.functionsUrl || `${supabaseClient.supabaseUrl}/functions/v1`;

  try {
    const response = await fetch(`${functionBaseUrl}/legalkart-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseClient.supabaseKey || '',
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const parsed = contentType.includes('application/json')
      ? await response.json()
      : { success: false, error: await response.text() };

    if (!response.ok) {
      throw new Error(parsed?.error || 'Failed to fetch case details');
    }

    return parsed as EcourtsFunctionResponse<T>;
  } catch (error) {
    if (error instanceof TypeError) {
      const isPreview = typeof window !== 'undefined' && window.location.hostname.includes('id-preview--');
      throw new Error(
        isPreview
          ? 'LegalKart fetch is blocked in preview. Please use the published URL to see the real API error.'
          : 'Could not reach the LegalKart service. Please try again.'
      );
    }

    throw error;
  }
};

export const useEcourtsCaseDetails = (caseId: string) => {
  const queryClient = useQueryClient();

  // Initially try to get from legalkart_cases by case_id
  const { data: legalkartCase, isLoading: isLoadingCase } = useQuery({
    queryKey: ['legalkart-case', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  // If no direct case found, fetch via CNR
  const { data: fallbackLegalkartCaseId } = useQuery({
    queryKey: ['legalkart-case-id-by-cnr', caseId],
    queryFn: () => fetchLegalkartCaseId(caseId),
    enabled: !!caseId && !legalkartCase?.id,
  });

  const effectiveLegalkartCaseId = legalkartCase?.id ?? fallbackLegalkartCaseId ?? null;

  const { data: petitioners } = useQuery({
    queryKey: ['petitioners', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase.from('petitioners').select('*').eq(filterColumn, filterValue);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: respondents } = useQuery({
    queryKey: ['respondents', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase.from('respondents').select('*').eq(filterColumn, filterValue);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: iaDetails } = useQuery({
    queryKey: ['ia-details', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase.from('ia_details').select('*').eq(filterColumn, filterValue);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: documents } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase.from('case_documents').select('*').eq('case_id', caseId).order('created_at', { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!caseId
  });

  const { data: orders } = useQuery({
    queryKey: ['case-orders', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase.from('case_orders').select('*').eq('case_id', caseId).order('hearing_date', { ascending: false }).limit(200);
      if (error) return [];
      return data;
    },
    enabled: !!caseId
  });

  const { data: objections } = useQuery({
    queryKey: ['case-objections', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase.from('case_objections').select('*').eq('case_id', caseId).order('created_at', { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!caseId
  });

  const { data: hearings } = useQuery({
    queryKey: ['case-hearings', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase.from('case_hearings').select('*').eq('case_id', caseId).order('hearing_date', { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!caseId
  });

  const refreshCaseData = useMutation({
    mutationFn: async () => {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('cnr_number, firm_id')
        .eq('id', caseId)
        .single();
      
      if (caseError) throw caseError;
      if (!caseData.cnr_number) {
        throw new Error('CNR number is required to refresh case.');
      }

      // Step 1: Trigger Scraper (POST)
      const refreshResult = await invokeEcourtsDirect({
        action: 'search',
        cnr: caseData.cnr_number,
        firmId: caseData.firm_id,
      });

      if (!refreshResult.success) {
        throw new Error(refreshResult.error || 'Failed to trigger refresh');
      }

      // Show immediate success for the trigger
      toast({ 
        title: "Refresh Queued", 
        description: "Scraper triggered successfully. CRM will auto-sync in 60 seconds.",
      });

      // Step 2: Delayed Background Sync (Wait 60s)
      console.log('⏳ Waiting 60s for scraper to complete before CRM sync...');
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Step 3: Fetch & Save to CRM (GET)
      console.log('🔄 Performing scheduled CRM sync...');
      const detailResult = await invokeEcourtsDirect({
        action: 'search',
        cnr: caseData.cnr_number,
        caseId,
        firmId: caseData.firm_id,
      });

      if (detailResult.success) {
        queryClient.invalidateQueries({ queryKey: ['case', caseId] });
        queryClient.invalidateQueries({ queryKey: ['legalkart-case', caseId] });
        queryClient.invalidateQueries({ queryKey: ['case-hearings', caseId] });
        queryClient.invalidateQueries({ queryKey: ['case-orders', caseId] });
        toast({ title: "CRM Sync Complete", description: "The case details have been updated with the latest LegalKart data." });
      }

      return detailResult;
    },
    onError: (error: any) => {
      toast({ 
        title: "Refresh Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    legalkartCase,
    petitioners: petitioners || [],
    respondents: respondents || [],
    iaDetails: iaDetails || [],
    documents: documents || [],
    orders: orders || [],
    objections: objections || [],
    hearings: hearings || [],
    isLoading: isLoadingCase,
    refreshCaseData: refreshCaseData.mutate,
    isRefreshing: refreshCaseData.isPending
  };
};
