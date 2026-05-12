/**
 * React Query Configuration
 * Centralized query configuration for consistent caching and refetching behavior
 */

export const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
  gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (formerly cacheTime)
  refetchOnWindowFocus: false, // Don't refetch when window regains focus
  retry: 1, // Retry failed queries once
};

export const dashboardQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 2 * 60 * 1000, // 2 minutes for frequently updated dashboard data
  gcTime: 5 * 60 * 1000, // 5 minutes cache
  refetchOnMount: true, // Always refetch dashboard on mount for fresh data
};

export const staticDataQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 15 * 60 * 1000, // 15 minutes for rarely changing data (e.g., team members, clients list)
  gcTime: 30 * 60 * 1000, // 30 minutes cache
};

// Phase 1 perf: realtime data should come from Supabase realtime channels,
// not aggressive polling. Window-focus refetch acts as a fallback only.
export const realtimeQueryConfig = {
  staleTime: 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes cache
  refetchOnWindowFocus: true, // fallback when realtime drops
  retry: 2,
};

export const filterQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 10 * 60 * 1000, // 10 minutes for filter dropdowns
  gcTime: 20 * 60 * 1000, // 20 minutes cache
};
