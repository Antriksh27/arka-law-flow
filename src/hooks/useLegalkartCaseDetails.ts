import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { fetchLegalkartCaseId } from '@/components/cases/legalkart/utils';

export const useLegalkartCaseDetails = (caseId: string) => {
  const queryClient = useQueryClient();

  // Initially try to get from legalkart_cases by case_id
  const { data: legalkartCase, isLoading: isLoadingCase } = useQuery({
    queryKey: ['legalkart-case', caseId],
    queryFn: async () => {
      console.log('Fetching legalkart case for case_id:', caseId);
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching legalkart case:', error);
        throw error;
      }
      console.log('Legalkart case found:', data);
      return data;
    },
    enabled: !!caseId
  });

  // If no direct case found, fetch via CNR
  const { data: fallbackLegalkartCaseId } = useQuery({
    queryKey: ['legalkart-case-id-by-cnr', caseId],
    queryFn: async () => {
      console.log('Attempting to fetch Legalkart case ID by CNR for case:', caseId);
      const legalkartCaseId = await fetchLegalkartCaseId(caseId);
      console.log('Fetched Legalkart case ID:', legalkartCaseId);
      return legalkartCaseId;
    },
    enabled: !!caseId && !legalkartCase?.id,
  });

  const effectiveLegalkartCaseId = legalkartCase?.id ?? fallbackLegalkartCaseId ?? null;
  console.log('Effective Legalkart case ID:', effectiveLegalkartCaseId);

  const { data: petitioners } = useQuery({
    queryKey: ['petitioners', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      console.log('Fetching petitioners for case_id:', caseId, 'legalkart_case_id:', effectiveLegalkartCaseId);
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase
        .from('petitioners')
        .select('*')
        .eq(filterColumn, filterValue);
      
      if (error) {
        console.error('Error fetching petitioners:', error);
        throw error;
      }
      console.log('Petitioners found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: respondents } = useQuery({
    queryKey: ['respondents', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      console.log('Fetching respondents for case_id:', caseId, 'legalkart_case_id:', effectiveLegalkartCaseId);
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase
        .from('respondents')
        .select('*')
        .eq(filterColumn, filterValue);
      
      if (error) {
        console.error('Error fetching respondents:', error);
        throw error;
      }
      console.log('Respondents found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: iaDetails } = useQuery({
    queryKey: ['ia-details', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      console.log('Fetching IA details for case_id:', caseId, 'legalkart_case_id:', effectiveLegalkartCaseId);
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase
        .from('ia_details')
        .select('*')
        .eq(filterColumn, filterValue);
      
      if (error) {
        console.error('Error fetching IA details:', error);
        throw error;
      }
      console.log('IA details found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: documents } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      
      console.log('Fetching documents for case_id:', caseId);
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
      console.log('Documents found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId
  });

  const { data: orders } = useQuery({
    queryKey: ['case-orders', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      
      console.log('Fetching orders for case_id:', caseId);
      const { data, error } = await supabase
        .from('case_orders')
        .select('*')
        .eq('case_id', caseId)
        .order('hearing_date', { ascending: false })
        .limit(200);
      
      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      console.log('Orders found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId
  });

  const { data: objections } = useQuery({
    queryKey: ['case-objections', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      
      console.log('Fetching objections for case_id:', caseId);
      const { data, error } = await supabase
        .from('case_objections')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching objections:', error);
        return [];
      }
      console.log('Objections found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId
  });

  const { data: hearings } = useQuery({
    queryKey: ['case-hearings', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      
      console.log('Fetching hearings for case_id:', caseId);
      const { data, error } = await supabase
        .from('case_hearings')
        .select('*')
        .eq('case_id', caseId)
        .order('hearing_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching hearings:', error);
        return [];
      }
      console.log('Hearings found:', data?.length || 0);
      return data;
    },
    enabled: !!caseId
  });

  const refreshCaseData = useMutation({
    mutationFn: async () => {
      console.log('Starting refresh for case:', caseId);
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('cnr_number, firm_id, court_type')
        .eq('id', caseId)
        .single();

      if (caseError) {
        console.error('Error fetching case data:', caseError);
        throw caseError;
      }

      // Check if CNR exists
      if (!caseData.cnr_number) {
        throw new Error('CNR number is required to fetch case details. Please add CNR first.');
      }

      // Auto-detect court type from CNR
      const cnr = caseData.cnr_number.toUpperCase().replace(/[-\s]/g, '');
      let searchType: 'high_court' | 'district_court' | 'supreme_court' = 'district_court';
      
      if (cnr.startsWith('SCIN')) {
        searchType = 'supreme_court';
      } else if (cnr.length >= 4 && cnr.substring(2, 4) === 'HC') {
        searchType = 'high_court';
      } else {
        searchType = 'district_court';
      }

      // Override with stored court_type if it exists
      if (caseData.court_type) {
        const courtTypeStr = caseData.court_type.toLowerCase();
        if (courtTypeStr.includes('supreme')) {
          searchType = 'supreme_court';
        } else if (courtTypeStr.includes('district')) {
          searchType = 'district_court';
        } else if (courtTypeStr.includes('high')) {
          searchType = 'high_court';
        }
      }

      console.log('Invoking legalkart-api with:', {
        action: 'search',
        cnr: caseData.cnr_number,
        searchType,
        caseId,
        firmId: caseData.firm_id
      });

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: caseData.cnr_number,
          searchType,
          caseId,
          firmId: caseData.firm_id
        }
      });

      if (error) {
        console.error('Error calling legalkart-api:', error);
        throw error;
      }

      // Check if the response itself indicates an error
      if (data && !data.success) {
        const errorMessage = data.error || data.message || 'Failed to fetch case details';
        console.error('Legalkart API returned error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Check if we actually got case data
      if (!data || !data.data) {
        throw new Error('No case data returned from Legalkart API');
      }

      console.log('Refresh completed successfully');
      return data;
    },
    onSuccess: () => {
      console.log('Refresh successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['petitioners', caseId] });
      queryClient.invalidateQueries({ queryKey: ['respondents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['ia-details', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-orders', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-objections', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-hearings', caseId] });
      toast({ title: "Case data refreshed successfully" });
    },
    onError: (error: any) => {
      console.error('Refresh failed:', error);
      toast({
        title: "Failed to refresh case data",
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
