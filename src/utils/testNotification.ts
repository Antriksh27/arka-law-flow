import { supabase } from '@/integrations/supabase/client';

export const sendTestNotification = async (userId: string) => {
  try {
    console.log('📧 Sending test notification to user:', userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: userId,
        notification_type: 'appointment',
        title: '🔔 Test Notification',
        message: 'This is a test notification with sound!',
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }

    console.log('✅ Test notification sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    throw error;
  }
};
