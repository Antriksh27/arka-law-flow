import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationPreferences } from '@/types/notificationTypes';
import { useToast } from '@/hooks/use-toast';

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no preferences exist, create default ones
      if (!data) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('role, firm_id')
          .eq('user_id', user.id)
          .single();

        const defaultPrefs = {
          user_id: user.id,
          firm_id: teamMember?.firm_id,
          enabled: true,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          delivery_preferences: {
            in_app: true,
            email: true,
            browser: true,
            sound: true,
          },
          categories: {
            case: { enabled: true, frequency: 'instant', priority_filter: 'normal' },
            hearing: { enabled: true, frequency: 'instant', priority_filter: 'all' },
            appointment: { enabled: true, frequency: 'instant', priority_filter: 'all' },
            task: { enabled: true, frequency: 'instant', priority_filter: 'normal' },
            document: { enabled: true, frequency: 'digest', priority_filter: 'high' },
            invoice: { enabled: true, frequency: 'instant', priority_filter: 'all' },
            message: { enabled: true, frequency: 'instant', priority_filter: 'normal' },
            client: { enabled: true, frequency: 'digest', priority_filter: 'normal' },
            team: { enabled: true, frequency: 'digest', priority_filter: 'normal' },
            system: { enabled: true, frequency: 'instant', priority_filter: 'all' },
            ecourts: { enabled: true, frequency: 'instant', priority_filter: 'high' },
            legal_news: { enabled: true, frequency: 'digest', priority_filter: 'high' },
            note: { enabled: true, frequency: 'digest', priority_filter: 'normal' },
          },
          event_preferences: {},
          digest_frequency: 'daily',
          digest_time: '09:00',
          muted_cases: [],
          muted_clients: [],
          muted_users: [],
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([defaultPrefs as any])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as unknown as NotificationPreferences;
      }

      return data as unknown as NotificationPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
      console.error('Update preferences error:', error);
    },
  });

  const toggleCategory = (category: string, enabled: boolean) => {
    if (!preferences) return;

    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...preferences.categories[category as keyof typeof preferences.categories],
        enabled,
      },
    };

    updatePreferences.mutate({ categories: updatedCategories });
  };

  const updateCategoryFrequency = (category: string, frequency: string) => {
    if (!preferences) return;

    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...preferences.categories[category as keyof typeof preferences.categories],
        frequency,
      },
    };

    updatePreferences.mutate({ categories: updatedCategories });
  };

  const updateCategoryPriorityFilter = (category: string, priority_filter: string) => {
    if (!preferences) return;

    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...preferences.categories[category as keyof typeof preferences.categories],
        priority_filter,
      },
    };

    updatePreferences.mutate({ categories: updatedCategories });
  };

  const toggleEvent = (eventId: string, enabled: boolean) => {
    if (!preferences) return;

    const updatedEventPrefs = {
      ...preferences.event_preferences,
      [eventId]: { enabled },
    };

    updatePreferences.mutate({ event_preferences: updatedEventPrefs });
  };

  const toggleGlobal = (enabled: boolean) => {
    updatePreferences.mutate({ enabled });
  };

  const updateQuietHours = (enabled: boolean, start?: string, end?: string) => {
    const updates: any = { quiet_hours_enabled: enabled };
    if (start) updates.quiet_hours_start = start;
    if (end) updates.quiet_hours_end = end;
    updatePreferences.mutate(updates);
  };

  const updateDeliveryChannels = (channels: Partial<NotificationPreferences['delivery_preferences']>) => {
    if (!preferences) return;

    updatePreferences.mutate({
      delivery_preferences: {
        ...preferences.delivery_preferences,
        ...channels,
      },
    });
  };

  const updateDigestSettings = (frequency: string, time?: string) => {
    const updates: any = { digest_frequency: frequency };
    if (time) updates.digest_time = time;
    updatePreferences.mutate(updates);
  };

  const muteEntity = (type: 'case' | 'client' | 'user', id: string) => {
    if (!preferences) return;

    const key = `muted_${type}s` as keyof Pick<NotificationPreferences, 'muted_cases' | 'muted_clients' | 'muted_users'>;
    const currentMuted = preferences[key] || [];
    
    if (!currentMuted.includes(id)) {
      updatePreferences.mutate({
        [key]: [...currentMuted, id],
      });
    }
  };

  const unmuteEntity = (type: 'case' | 'client' | 'user', id: string) => {
    if (!preferences) return;

    const key = `muted_${type}s` as keyof Pick<NotificationPreferences, 'muted_cases' | 'muted_clients' | 'muted_users'>;
    const currentMuted = preferences[key] || [];
    
    updatePreferences.mutate({
      [key]: currentMuted.filter((mutedId) => mutedId !== id),
    });
  };

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferences.mutate,
    toggleCategory,
    updateCategoryFrequency,
    updateCategoryPriorityFilter,
    toggleEvent,
    toggleGlobal,
    updateQuietHours,
    updateDeliveryChannels,
    updateDigestSettings,
    muteEntity,
    unmuteEntity,
  };
};
