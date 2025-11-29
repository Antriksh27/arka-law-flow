import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeQueryConfig } from '@/lib/queryConfig';

export type ModuleNotificationCounts = Record<string, number>;

// Map notification types to menu modules
const getModuleFromNotificationType = (notificationType: string): string | null => {
  if (notificationType.startsWith('case_')) return 'Cases';
  if (notificationType.startsWith('hearing_')) return 'Hearings';
  if (notificationType.startsWith('appointment_')) return 'Appointments';
  if (notificationType.startsWith('task_')) return 'Tasks';
  if (notificationType.startsWith('document_')) return 'Documents';
  if (notificationType.startsWith('client_') || notificationType.includes('contact_')) return 'Clients';
  if (notificationType.startsWith('team_')) return 'Team';
  if (notificationType.startsWith('note_')) return 'Notes';
  if (notificationType.startsWith('message_') || notificationType.includes('direct_message')) return 'Chat';
  return null;
};

export const useModuleNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notification counts grouped by module
  const { data: moduleCounts = {} as ModuleNotificationCounts } = useQuery({
    queryKey: ['module-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return {} as ModuleNotificationCounts;

      const { data, error } = await supabase
        .from('notifications')
        .select('notification_type')
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Count notifications by module
      const counts: ModuleNotificationCounts = {
        Cases: 0,
        Hearings: 0,
        Appointments: 0,
        Tasks: 0,
        Documents: 0,
        Clients: 0,
        Team: 0,
        Notes: 0,
        Chat: 0,
        Contacts: 0,
      };

      data?.forEach((notification) => {
        const module = getModuleFromNotificationType(notification.notification_type);
        if (module && counts[module] !== undefined) {
          counts[module]++;
        }
      });

      return counts;
    },
    enabled: !!user?.id,
    ...realtimeQueryConfig,
  });

  // Real-time subscription for notification updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('module-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Invalidate query to refetch counts
          queryClient.invalidateQueries({ queryKey: ['module-notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return { moduleCounts };
};
