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
        .select('cnr_number, firm_id, court_type')
        .eq('id', caseId)
        .single();
      if (caseError) throw caseError;
      if (!caseData.cnr_number) {
        throw new Error('CNR number is required to fetch case details. Please add CNR first.');
      }

      // Use new ecourts-api — no searchType needed, single CNR endpoint handles all courts
      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: {
          action: 'case_detail',
          cnr: caseData.cnr_number,
          caseId,
          firmId: caseData.firm_id,
        }
      });
      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to fetch case details');
      }
      if (!data?.data) throw new Error('No case data returned');
      return data;
    },
    onSuccess: () => {
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
      toast({ title: "Failed to refresh case data", description: error.message, variant: "destructive" });
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
