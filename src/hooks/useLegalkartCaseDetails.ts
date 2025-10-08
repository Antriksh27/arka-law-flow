import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const { data: petitioners } = useQuery({
    queryKey: ['petitioners', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('petitioners')
        .select('*')
        .eq('case_id', caseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const { data: respondents } = useQuery({
    queryKey: ['respondents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('respondents')
        .select('*')
        .eq('case_id', caseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const { data: iaDetails } = useQuery({
    queryKey: ['ia-details', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_details')
        .select('*')
        .eq('case_id', caseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const { data: documents } = useQuery({
    queryKey: ['legalkart-documents', caseId],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_documents')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id
  });

  const { data: orders } = useQuery({
    queryKey: ['legalkart-orders', caseId],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_orders')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id
  });

  const { data: objections } = useQuery({
    queryKey: ['legalkart-objections', caseId],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_objections')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id
  });

  const { data: hearings } = useQuery({
    queryKey: ['legalkart-hearings', caseId],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_history')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id)
        .order('hearing_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id
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
