import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import NotificationSounds from '@/lib/notificationSounds';
import BrowserNotifications from '@/lib/browserNotifications';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id?: string;
  read: boolean;
  created_at: string;
  recipient_id: string;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const subscribedUserRef = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);

  useEffect(() => {
    if (!user?.id) return;

    // Phase 1 perf: guard against StrictMode double-subscribe and remount churn.
    if (subscribedUserRef.current === user.id && channelRef.current) {
      return;
    }

    console.log('🔔 Setting up real-time notifications for user:', user.id);

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    subscribedUserRef.current = user.id;

    // Create new channel for real-time notifications
    channelRef.current = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔔 Real-time notification received:', payload);
          
          const newNotification = payload.new as Notification;
          
          try {
            console.log('🔔 Processing notification:', {
              type: newNotification.notification_type,
              title: newNotification.title,
              message: newNotification.message
            });

            // Check category preferences
            const preferences = localStorage.getItem('notification-category-preferences');
            let categoryEnabled = true;
            
            if (preferences) {
              try {
                const prefs = JSON.parse(preferences);
                const category = (newNotification as any).category || 'system';
                categoryEnabled = prefs[category] !== false;
              } catch (e) {
                console.error('Error parsing notification preferences:', e);
              }
            }

            if (!categoryEnabled) {
              console.log('🔕 Notification category disabled, skipping');
              // Still update queries but don't show notification
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
              return;
            }

            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 8000,
            });
            console.log('✅ Toast notification shown');

            // Play notification sound
            if (NotificationSounds.isAudioEnabled()) {
              try {
                const priority = (newNotification as any).priority || 'normal';
                const soundType = priority === 'urgent' ? 'warning' : 
                                priority === 'high' ? 'info' : 'default';
                
                console.log('🔊 Playing notification sound:', soundType);
                await NotificationSounds.play(soundType);
                console.log('✅ Notification sound played');
              } catch (soundError) {
                console.error('❌ Sound error:', soundError);
              }
            }

            // Show browser notification if enabled and app not in focus
            if (BrowserNotifications.getPermission() === 'granted' && document.hidden) {
              try {
                const category = (newNotification as any).category || 'system';
                const priority = (newNotification as any).priority || 'normal';
                const actionUrl = (newNotification as any).action_url;
                
                await BrowserNotifications.showCategoryNotification(
                  category,
                  newNotification.title,
                  newNotification.message,
                  actionUrl,
                  priority
                );
                console.log('✅ Browser notification shown');
              } catch (browserError) {
                console.error('❌ Browser notification error:', browserError);
              }
            }

            // Refresh notification queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
            
            console.log('🔔 Notification processed successfully');
          } catch (error) {
            console.error('🔔 Error processing notification:', error);
            
            // Fallback toast
            toast({
              title: "New Notification",
              description: newNotification.message || "You have a new notification",
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload);
          // Refresh notification queries when notifications are marked as read
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        }
      )
      .subscribe((status) => {
        console.log('🔔 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          retryAttemptRef.current = 0;
          console.log('✅ Successfully subscribed to real-time notifications');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          // Phase 1 perf: exponential backoff to stop the reconnect storm.
          const attempt = retryAttemptRef.current + 1;
          retryAttemptRef.current = attempt;
          const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
          console.warn(`🔔 Realtime ${status} — retry #${attempt} in ${delay}ms`);

          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            // Force resubscribe by clearing the guard so the effect re-runs on next user change.
            subscribedUserRef.current = null;
            // Trigger a soft refetch so missed notifications appear.
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
          }, delay);
        }
      });

    // Cleanup function
    return () => {
      console.log('🔔 Cleaning up real-time notifications');
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      subscribedUserRef.current = null;
    };
    // Phase 1 perf: only re-run when the user changes. toast/queryClient are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { 
    // Return any utility functions if needed
    playTestSound: () => NotificationSounds.testSound()
  };
};
