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

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up real-time notifications for user:', user.id);

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for real-time notifications
    channelRef.current = supabase
      .channel(`notifications-${user.id}`)
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
          console.log('✅ Successfully subscribed to real-time notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to real-time notifications');
        }
      });

    // Cleanup function
    return () => {
      console.log('🔔 Cleaning up real-time notifications');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, toast, queryClient]);

  return { 
    // Return any utility functions if needed
    playTestSound: () => NotificationSounds.testSound()
  };
};