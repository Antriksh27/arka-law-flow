import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface LegalkartSearchOptions {
  cnr: string;
  searchType: 'high_court' | 'district_court' | 'supreme_court' | 'gujarat_display_board' | 'district_cause_list';
  caseId?: string;
}

interface BatchSearchOptions {
  cnrs: string[];
}

export const useLegalkartIntegration = () => {
  const { toast } = useToast();

  // Single case search
  const searchCase = useMutation({
    mutationFn: async ({ cnr, searchType, caseId }: LegalkartSearchOptions) => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { 
          action: 'search', 
          cnr, 
          searchType, 
          caseId 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: "Search Successful",
          description: `Case data retrieved for ${variables.searchType}`,
        });
      } else {
        toast({
          title: "Search Failed",
          description: data.error || "Failed to retrieve case data",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Batch search
  const batchSearch = useMutation({
    mutationFn: async ({ cnrs }: BatchSearchOptions) => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { 
          action: 'batch_search', 
          cnrs 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Batch Search Completed",
          description: `Processed ${data.processed} CNRs`,
        });
      } else {
        toast({
          title: "Batch Search Failed",
          description: data.error || "Failed to process batch search",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Batch Search Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gujarat Display Board
  const getDisplayBoard = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { action: 'gujarat_display_board' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Display Board Fetched",
          description: "Gujarat display board data retrieved successfully",
        });
      } else {
        toast({
          title: "Display Board Failed",
          description: data.error || "Failed to fetch display board",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Display Board Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Authenticate with Legalkart
  const authenticate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { action: 'authenticate' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Authentication Successful",
          description: "Connected to Legalkart API",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: data.error || "Failed to authenticate with Legalkart",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get search history for a case
  const useSearchHistory = (caseId?: string) => {
    return useQuery({
      queryKey: ['legalkart-searches', caseId],
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
      queryKey: ['legalkart-firm-searches'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('legalkart_case_searches')
          .select(`
            *,
            cases(case_title, cnr_number)
          `)
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
      toast({
        title: "Auto-fetch Updated",
        description: `CNR auto-fetch has been ${enabled ? 'enabled' : 'disabled'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    searchCase,
    batchSearch,
    getDisplayBoard,
    authenticate,
    toggleAutoFetch,
    useSearchHistory,
    useFirmSearchHistory,
  };
};