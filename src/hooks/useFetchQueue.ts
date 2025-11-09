import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface QueueItem {
  id: string;
  case_id: string;
  firm_id: string;
  cnr_number: string;
  court_type: string;
  status: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  last_error?: string;
  last_error_at?: string;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  next_retry_at?: string;
  created_by: string;
  batch_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  cases?: {
    case_title: string;
    case_number?: string;
  };
}

export interface QueueStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export const useFetchQueue = () => {
  const { firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch queue items
  const { data: queueItems = [], isLoading } = useQuery({
    queryKey: ['fetch-queue', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      
      const { data, error } = await supabase
        .from('case_fetch_queue')
        .select('*, cases(case_title, case_number)')
        .eq('firm_id', firmId)
        .order('priority', { ascending: true })
        .order('queued_at', { ascending: true });

      if (error) throw error;
      return data as QueueItem[];
    },
    enabled: !!firmId,
  });

  // Calculate stats
  const stats: QueueStats = {
    queued: queueItems.filter(item => item.status === 'queued').length,
    processing: queueItems.filter(item => item.status === 'processing').length,
    completed: queueItems.filter(item => item.status === 'completed').length,
    failed: queueItems.filter(item => item.status === 'failed').length,
    total: queueItems.length,
  };

  // Real-time subscription
  useEffect(() => {
    if (!firmId) return;

    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_fetch_queue',
          filter: `firm_id=eq.${firmId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, queryClient]);

  // Add to queue mutation
  const addToQueue = useMutation({
    mutationFn: async (items: Array<{
      case_id: string;
      cnr_number: string;
      court_type: string;
      priority?: number;
      batch_id?: string;
      metadata?: any;
    }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !firmId) throw new Error('Not authenticated');

      const inserts = items.map(item => ({
        ...item,
        firm_id: firmId,
        created_by: user.id,
        priority: item.priority || 5,
      }));

      const { error } = await supabase
        .from('case_fetch_queue')
        .insert(inserts);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      toast({
        title: "Added to queue",
        description: "Cases have been queued for fetching",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process queue mutation
  const processQueue = useMutation({
    mutationFn: async ({ batch_size = 10, delay_ms = 1500 }: { batch_size?: number; delay_ms?: number }) => {
      const { data, error } = await supabase.functions.invoke('process-fetch-queue', {
        body: { batch_size, delay_ms }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      queryClient.invalidateQueries({ queryKey: ['cases-fetch-status'] });
      toast({
        title: "Queue processing complete",
        description: `${data.result.succeeded} succeeded, ${data.result.failed} failed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Queue processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update queue item
  const updateQueueItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QueueItem> }) => {
      const { error } = await supabase
        .from('case_fetch_queue')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
    },
  });

  // Delete queue items
  const deleteQueueItems = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('case_fetch_queue')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      toast({
        title: "Removed from queue",
        description: "Selected items have been removed",
      });
    },
  });

  // Retry failed items
  const retryFailed = useMutation({
    mutationFn: async () => {
      const failedIds = queueItems
        .filter(item => item.status === 'failed' && item.retry_count < item.max_retries)
        .map(item => item.id);

      if (failedIds.length === 0) return;

      const { error } = await supabase
        .from('case_fetch_queue')
        .update({ 
          status: 'queued',
          next_retry_at: new Date().toISOString()
        })
        .in('id', failedIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      toast({
        title: "Failed items queued for retry",
        description: "Processing will begin shortly",
      });
    },
  });

  // Clear completed items
  const clearCompleted = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('case_fetch_queue')
        .delete()
        .eq('status', 'completed')
        .eq('firm_id', firmId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      toast({
        title: "Cleared completed items",
        description: "Completed items have been removed from queue",
      });
    },
  });

  // Stop processing mutation
  const stopProcessing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('case_fetch_queue')
        .update({ 
          status: 'failed', 
          last_error: 'Processing stopped by user',
          last_error_at: new Date().toISOString()
        })
        .eq('status', 'processing')
        .eq('firm_id', firmId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      toast({
        title: "Processing stopped",
        description: "All processing items have been marked as failed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to stop processing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Queue all eligible cases
  const queueAllEligible = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !firmId) throw new Error('Not authenticated');

      // Get all cases with CNR and court_type that aren't already in queue
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('id, cnr_number, court_type')
        .eq('firm_id', firmId)
        .not('cnr_number', 'is', null)
        .not('court_type', 'is', null)
        .in('court_type', ['High Court', 'District Court', 'Supreme Court']);

      if (casesError) throw casesError;
      if (!cases || cases.length === 0) {
        throw new Error('No eligible cases found');
      }

      // Get existing queue items to avoid duplicates
      const { data: existing, error: existingError } = await supabase
        .from('case_fetch_queue')
        .select('case_id')
        .eq('firm_id', firmId);

      if (existingError) throw existingError;

      const existingCaseIds = new Set(existing?.map(e => e.case_id) || []);
      const newCases = cases.filter(c => !existingCaseIds.has(c.id));

      if (newCases.length === 0) {
        throw new Error('All eligible cases are already in queue');
      }

      // Insert new queue items
      const inserts = newCases.map(c => ({
        case_id: c.id,
        cnr_number: c.cnr_number!,
        court_type: c.court_type!,
        firm_id: firmId,
        created_by: user.id,
        priority: 5,
        metadata: { triggered_by: 'queue_all_eligible' }
      }));

      const { error: insertError } = await supabase
        .from('case_fetch_queue')
        .insert(inserts);

      if (insertError) throw insertError;

      return { queued: newCases.length, skipped: cases.length - newCases.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fetch-queue'] });
      toast({
        title: "Cases queued successfully",
        description: `${data.queued} case(s) added to queue${data.skipped > 0 ? `, ${data.skipped} already queued` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to queue cases",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    queueItems,
    stats,
    isLoading,
    addToQueue,
    processQueue,
    updateQueueItem,
    deleteQueueItems,
    retryFailed,
    clearCompleted,
    queueAllEligible,
    stopProcessing,
  };
};