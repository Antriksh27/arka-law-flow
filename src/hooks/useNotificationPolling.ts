/**
 * Notification Polling Hook
 * Fallback mechanism for when realtime connections fail
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationPollerManager } from '@/lib/notificationPoller';
import { useToast } from '@/hooks/use-toast';

interface UseNotificationPollingOptions {
  enabled?: boolean;
  interval?: number;
}

export const useNotificationPolling = (options: UseNotificationPollingOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { enabled = false, interval = 30000 } = options;

  useEffect(() => {
    if (!user?.id || !enabled) return;

    console.log('📊 Setting up notification polling fallback');

    const poller = NotificationPollerManager.getOrCreate({
      userId: user.id,
      interval,
      onNewNotifications: (count) => {
        console.log(`📊 Polling detected ${count} new notifications`);
        
        // Invalidate queries to fetch new notifications
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        
        // Optional: Show a subtle toast
        if (count > 0) {
          toast({
            title: 'New Notifications',
            description: `You have ${count} new ${count === 1 ? 'notification' : 'notifications'}`,
            duration: 3000,
          });
        }
      },
      onError: (error) => {
        console.error('📊 Polling error:', error);
      },
    });

    poller.start();

    return () => {
      console.log('📊 Cleaning up notification polling');
      NotificationPollerManager.remove(user.id);
    };
  }, [user?.id, enabled, interval, queryClient, toast]);
};

export default useNotificationPolling;
