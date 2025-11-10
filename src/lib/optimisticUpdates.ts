/**
 * Optimistic Update Utilities
 * Provides reusable patterns for implementing optimistic updates with automatic rollback
 */

import { QueryClient } from '@tanstack/react-query';

export interface OptimisticUpdateConfig<TData, TNewItem> {
  queryKey: string[];
  newItem: TNewItem;
  addToList?: (oldData: TData, newItem: TNewItem) => TData;
  updateInList?: (oldData: TData, newItem: TNewItem) => TData;
  removeFromList?: (oldData: TData, itemId: string) => TData;
}

/**
 * Optimistically add an item to a list
 */
export const optimisticallyAddItem = <TData, TNewItem>(
  queryClient: QueryClient,
  config: OptimisticUpdateConfig<TData, TNewItem>
) => {
  const previousData = queryClient.getQueryData<TData>(config.queryKey);

  if (previousData && config.addToList) {
    queryClient.setQueryData<TData>(
      config.queryKey,
      config.addToList(previousData, config.newItem)
    );
  }

  return { previousData };
};

/**
 * Optimistically update an item in a list
 */
export const optimisticallyUpdateItem = <TData, TNewItem>(
  queryClient: QueryClient,
  config: OptimisticUpdateConfig<TData, TNewItem>
) => {
  const previousData = queryClient.getQueryData<TData>(config.queryKey);

  if (previousData && config.updateInList) {
    queryClient.setQueryData<TData>(
      config.queryKey,
      config.updateInList(previousData, config.newItem)
    );
  }

  return { previousData };
};

/**
 * Optimistically remove an item from a list
 */
export const optimisticallyRemoveItem = <TData>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
  removeFromList: (oldData: TData, itemId: string) => TData
) => {
  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData) {
    queryClient.setQueryData<TData>(
      queryKey,
      removeFromList(previousData, itemId)
    );
  }

  return { previousData };
};

/**
 * Rollback optimistic update on error
 */
export const rollbackOptimisticUpdate = <TData>(
  queryClient: QueryClient,
  queryKey: string[],
  previousData: TData | undefined
) => {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  }
};

/**
 * Helper to create optimistic mutation options
 */
export const createOptimisticMutationOptions = <TData, TNewItem, TError = Error>(
  queryClient: QueryClient,
  config: OptimisticUpdateConfig<TData, TNewItem> & {
    onSuccessCallback?: () => void;
    onErrorCallback?: (error: TError) => void;
    invalidateQueries?: string[][];
  }
) => ({
  onMutate: async () => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: config.queryKey });

    // Snapshot previous value
    const previousData = queryClient.getQueryData<TData>(config.queryKey);

    // Optimistically update
    if (previousData && config.addToList) {
      queryClient.setQueryData<TData>(
        config.queryKey,
        config.addToList(previousData, config.newItem)
      );
    }

    return { previousData };
  },
  onError: (error: TError, _variables: any, context: any) => {
    // Rollback on error
    if (context?.previousData) {
      queryClient.setQueryData(config.queryKey, context.previousData);
    }
    config.onErrorCallback?.(error);
  },
  onSuccess: () => {
    config.onSuccessCallback?.();
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: config.queryKey });
    config.invalidateQueries?.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }
});
