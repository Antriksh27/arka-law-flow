import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import NotificationSounds from '@/lib/notificationSounds';

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
            // Play notification sound based on type
            const soundType = newNotification.notification_type === 'appointment' ? 'info' : 'default';
            console.log('🔊 Playing notification sound:', soundType);
            await NotificationSounds.play(soundType);
            
            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
              sound: false, // Don't double-play sound since we already played it above
            });

            // Refresh notification queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
            
            console.log('🔔 Notification processed successfully');
          } catch (error) {
            console.error('🔔 Error processing notification:', error);
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