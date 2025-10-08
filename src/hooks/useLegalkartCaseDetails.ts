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
    queryKey: ['legalkart-documents', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) {
        console.log('No effective Legalkart case ID for documents');
        return [];
      }
      console.log('Fetching documents for legalkart_case_id:', effectiveLegalkartCaseId);
      const { data, error } = await supabase
        .from('legalkart_case_documents')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId);
      
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      console.log('Documents found:', data?.length || 0);
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const { data: orders } = useQuery({
    queryKey: ['legalkart-orders', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) {
        console.log('No effective Legalkart case ID for orders');
        return [];
      }
      console.log('Fetching orders for legalkart_case_id:', effectiveLegalkartCaseId);
      const { data, error } = await supabase
        .from('legalkart_case_orders')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId);
      
      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      console.log('Orders found:', data?.length || 0);
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const { data: objections } = useQuery({
    queryKey: ['legalkart-objections', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) {
        console.log('No effective Legalkart case ID for objections');
        return [];
      }
      console.log('Fetching objections for legalkart_case_id:', effectiveLegalkartCaseId);
      const { data, error } = await supabase
        .from('legalkart_case_objections')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId);
      
      if (error) {
        console.error('Error fetching objections:', error);
        throw error;
      }
      console.log('Objections found:', data?.length || 0);
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const { data: hearings } = useQuery({
    queryKey: ['legalkart-hearings', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) {
        console.log('No effective Legalkart case ID for hearings');
        return [];
      }
      console.log('Fetching hearings for legalkart_case_id:', effectiveLegalkartCaseId);
      const { data, error } = await supabase
        .from('legalkart_case_history')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId)
        .order('hearing_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching hearings:', error);
        throw error;
      }
      console.log('Hearings found:', data?.length || 0);
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const refreshCaseData = useMutation({
    mutationFn: async () => {
      console.log('Starting refresh for case:', caseId);
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('cnr_number, firm_id')
        .eq('id', caseId)
        .single();

      if (caseError) {
        console.error('Error fetching case data:', caseError);
        throw caseError;
      }

      console.log('Invoking legalkart-api with:', {
        action: 'search',
        cnr: caseData.cnr_number,
        searchType: 'high_court',
        caseId,
        firmId: caseData.firm_id
      });

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: caseData.cnr_number,
          searchType: 'high_court',
          caseId,
          firmId: caseData.firm_id
        }
      });

      if (error) {
        console.error('Error calling legalkart-api:', error);
        throw error;
      }
      console.log('Refresh completed successfully');
      return data;
    },
    onSuccess: () => {
      console.log('Refresh successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['legalkart-case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['petitioners', caseId] });
      queryClient.invalidateQueries({ queryKey: ['respondents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['ia-details', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-documents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-orders', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-objections', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-hearings', caseId] });
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
