import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  type: 'created' | 'updated' | 'status_changed';
  appointment_id: string;
  lawyer_id: string;
  title: string;
  message: string;
  metadata?: any;
}

export const sendAppointmentNotification = async (data: NotificationData) => {
  try {
    console.log('Sending appointment notification:', data);
    
    const { data: result, error } = await supabase.functions.invoke('notify-appointment-changes', {
      body: data
    });

    if (error) {
      console.error('Error sending notification:', error);
      throw error;
    }

    console.log('Notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send appointment notification:', error);
    throw error;
  }
};