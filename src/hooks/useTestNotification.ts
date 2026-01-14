import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export type TestNotificationType = 'basic' | 'urgent' | 'quiet_hours' | 'digest' | 'all_categories';

interface SendTestNotificationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const useTestNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const sendTestNotification = async (
    testType: TestNotificationType = 'basic'
  ): Promise<SendTestNotificationResult> => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send test notifications',
        variant: 'destructive',
      });
      return { success: false, error: 'Not authenticated' };
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        body: {
          userId: user.id,
          testType,
        },
      });

      if (error) throw error;

      // Invalidate notification queries to show the new notification
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['module-notifications'] });

      toast({
        title: 'Test Notification Sent',
        description: data.message || 'Check your notifications to verify the system is working.',
      });

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      toast({
        title: 'Failed to Send Test',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendTestNotification,
    isSending,
  };
};

export default useTestNotification;
