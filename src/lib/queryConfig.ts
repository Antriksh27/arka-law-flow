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
};

export const staticDataQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 15 * 60 * 1000, // 15 minutes for rarely changing data (e.g., team members, clients list)
  gcTime: 30 * 60 * 1000, // 30 minutes cache
};

export const realtimeQueryConfig = {
  staleTime: 30 * 1000, // 30 seconds for real-time data (messages, notifications)
  gcTime: 2 * 60 * 1000, // 2 minutes cache
  refetchOnWindowFocus: true, // Refetch on focus for real-time data
  retry: 2,
};

export const filterQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 10 * 60 * 1000, // 10 minutes for filter dropdowns
  gcTime: 20 * 60 * 1000, // 20 minutes cache
};
