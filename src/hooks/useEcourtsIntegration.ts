import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EcourtsSearchOptions {
  cnr: string;
  caseId?: string;
}

interface CaseSearchOptions {
  query?: string;
  advocates?: string;
  judges?: string;
  petitioners?: string;
  respondents?: string;
  litigants?: string;
  courtCodes?: string[];
  caseTypes?: string[];
  caseStatuses?: string[];
  filingDateFrom?: string;
  filingDateTo?: string;
  pageSize?: number;
  page?: number;
}

interface CauselistSearchOptions {
  q?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  judge?: string;
  advocate?: string;
  state?: string;
  districtCode?: string;
  courtComplexCode?: string;
  court?: string;
  courtNo?: string;
  bench?: string;
  litigant?: string;
  listType?: string;
  limit?: number;
  offset?: number;
}

export const useEcourtsIntegration = () => {
  const { toast } = useToast();

  // Get firmId from current user
  const getFirmId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('firm_id')
      .eq('user_id', user.id)
      .single();
    return teamMember?.firm_id || null;
  };

  // Single case fetch by CNR
  const searchCase = useMutation({
    mutationFn: async ({ cnr, caseId }: EcourtsSearchOptions) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in to fetch case details');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'case_detail', cnr, caseId, firmId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Case Found", description: "Case data retrieved successfully" });
      } else {
        toast({ title: "Search Failed", description: data.error || "Failed to retrieve case data", variant: "destructive" });
      }
    },
    onError: (error) => {
      toast({ title: "Search Error", description: error.message, variant: "destructive" });
    },
  });

  // Full-text case search
  const caseSearch = useMutation({
    mutationFn: async (options: CaseSearchOptions) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in to search cases');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'case_search', firmId, ...options },
      });
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({ title: "Search Error", description: error.message, variant: "destructive" });
    },
  });

  // Cause list search
  const causelistSearch = useMutation({
    mutationFn: async (options: CauselistSearchOptions) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in to search cause lists');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'causelist_search', firmId, ...options },
      });
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({ title: "Cause List Error", description: error.message, variant: "destructive" });
    },
  });

  // Cause list available dates
  const causelistDates = useMutation({
    mutationFn: async (options: { state?: string; districtCode?: string; courtComplexCode?: string }) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'causelist_dates', firmId, ...options },
      });
      if (error) throw error;
      return data;
    },
  });

  // Court structure
  const courtStructure = useMutation({
    mutationFn: async (endpoint: string) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'court_structure', firmId, endpoint },
      });
      if (error) throw error;
      return data;
    },
  });

  // Single case refresh
  const refreshCase = useMutation({
    mutationFn: async (cnr: string) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'case_refresh', cnr, firmId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Refresh Queued", description: "Case data will be updated in a few seconds" });
    },
    onError: (error) => {
      toast({ title: "Refresh Error", description: error.message, variant: "destructive" });
    },
  });

  // Bulk refresh
  const bulkRefresh = useMutation({
    mutationFn: async (cnrs: string[]) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'bulk_refresh', cnrs, firmId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Bulk Refresh Queued", description: `${data?.data?.refreshed?.length ?? 0} cases queued for update` });
    },
    onError: (error) => {
      toast({ title: "Bulk Refresh Error", description: error.message, variant: "destructive" });
    },
  });

  // Batch search (legacy compat - fetches multiple CNRs)
  const batchSearch = useMutation({
    mutationFn: async ({ cnrs }: { cnrs: string[] }) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'batch_search', cnrs, firmId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Batch Search Completed", description: `Processed ${data.processed} CNRs` });
      }
    },
    onError: (error) => {
      toast({ title: "Batch Search Error", description: error.message, variant: "destructive" });
    },
  });

  // Sync display board / cause list to DB
  const syncDisplayBoard = useMutation({
    mutationFn: async (options?: { targetDate?: string; state?: string; districtCode?: string; advocate?: string }) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'sync_display_board', firmId, ...options },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Board Synced", description: `Synced ${data.synced} hearings from cause list` });
      }
    },
    onError: (error) => {
      toast({ title: "Sync Error", description: error.message, variant: "destructive" });
    },
  });

  // Order AI analysis
  const getOrderAI = useMutation({
    mutationFn: async ({ cnr, filename }: { cnr: string; filename: string }) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'order_ai', cnr, filename, firmId },
      });
      if (error) throw error;
      return data;
    },
  });

  // Enums
  const getEnums = useMutation({
    mutationFn: async (types?: string) => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'enums', types, firmId },
      });
      if (error) throw error;
      return data;
    },
  });

  // Legacy getDisplayBoard (maps to causelist_search for backward compat)
  const getDisplayBoard = useMutation({
    mutationFn: async () => {
      const firmId = await getFirmId();
      if (!firmId) throw new Error('Please sign in to fetch cause list');

      const { data, error } = await supabase.functions.invoke('ecourts-api', {
        body: { action: 'causelist_search', firmId, date: new Date().toISOString().split('T')[0], limit: 100 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Cause List Fetched", description: "Cause list data retrieved successfully" });
      }
    },
    onError: (error) => {
      toast({ title: "Cause List Error", description: error.message, variant: "destructive" });
    },
  });

  // Get search history for a case
  const useSearchHistory = (caseId?: string) => {
    return useQuery({
      queryKey: ['ecourts-searches', caseId],
      queryFn: async () => {
        if (!caseId) return [];
        const { data, error } = await supabase
          .from('legalkart_case_searches')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      enabled: !!caseId,
    });
  };

  // Get all search history for the firm
  const useFirmSearchHistory = () => {
    return useQuery({
      queryKey: ['ecourts-firm-searches'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('legalkart_case_searches')
          .select(`*, cases(case_title, cnr_number)`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data;
      },
    });
  };

  // Toggle auto-fetch for a case
  const toggleAutoFetch = useMutation({
    mutationFn: async ({ caseId, enabled }: { caseId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('cases')
        .update({ cnr_auto_fetch_enabled: enabled })
        .eq('id', caseId);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      toast({ title: "Auto-fetch Updated", description: `CNR auto-fetch has been ${enabled ? 'enabled' : 'disabled'}` });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    searchCase,
    caseSearch,
    causelistSearch,
    causelistDates,
    courtStructure,
    refreshCase,
    bulkRefresh,
    batchSearch,
    syncDisplayBoard,
    getDisplayBoard,
    getOrderAI,
    getEnums,
    toggleAutoFetch,
    useSearchHistory,
    useFirmSearchHistory,
  };
};

// Re-export as useLegalkartIntegration for backward compatibility
export const useLegalkartIntegration = useEcourtsIntegration;
