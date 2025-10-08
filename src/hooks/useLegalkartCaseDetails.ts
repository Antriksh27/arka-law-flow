import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { fetchLegalkartCaseId } from '@/components/cases/legalkart/utils';

export const useLegalkartCaseDetails = (caseId: string) => {
  const queryClient = useQueryClient();

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

  const { data: fallbackLegalkartCaseId } = useQuery({
    queryKey: ['legalkart-case-id-by-cnr', caseId],
    queryFn: async () => fetchLegalkartCaseId(caseId),
    enabled: !!caseId && !legalkartCase?.id,
  });

  const effectiveLegalkartCaseId = legalkartCase?.id ?? fallbackLegalkartCaseId ?? null;

  const { data: petitioners } = useQuery({
    queryKey: ['petitioners', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      const filterColumn = effectiveLegalkartCaseId ? 'legalkart_case_id' : 'case_id';
      const filterValue = effectiveLegalkartCaseId ?? caseId;
      const { data, error } = await supabase
        .from('petitioners')
        .select('*')
        .eq(filterColumn, filterValue);
      
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
      const { data, error } = await supabase
        .from('respondents')
        .select('*')
        .eq(filterColumn, filterValue);
      
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
      const { data, error } = await supabase
        .from('ia_details')
        .select('*')
        .eq(filterColumn, filterValue);
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId || !!effectiveLegalkartCaseId
  });

  const { data: documents } = useQuery({
    queryKey: ['legalkart-documents', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) return [];
      const { data, error } = await supabase
        .from('legalkart_case_documents')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const { data: orders } = useQuery({
    queryKey: ['legalkart-orders', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) return [];
      const { data, error } = await supabase
        .from('legalkart_case_orders')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const { data: objections } = useQuery({
    queryKey: ['legalkart-objections', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) return [];
      const { data, error } = await supabase
        .from('legalkart_case_objections')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const { data: hearings } = useQuery({
    queryKey: ['legalkart-hearings', caseId, effectiveLegalkartCaseId],
    queryFn: async () => {
      if (!effectiveLegalkartCaseId) return [];
      const { data, error } = await supabase
        .from('legalkart_case_history')
        .select('*')
        .eq('legalkart_case_id', effectiveLegalkartCaseId)
        .order('hearing_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveLegalkartCaseId
  });

  const refreshCaseData = useMutation({
    mutationFn: async () => {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('cnr_number, firm_id')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: caseData.cnr_number,
          searchType: 'high_court',
          caseId,
          firmId: caseData.firm_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
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
