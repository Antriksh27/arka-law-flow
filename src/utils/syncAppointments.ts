import { supabase } from '@/integrations/supabase/client';

export const triggerAppointmentSync = async () => {
  try {
    console.log('Triggering appointment sync...');
    
    const { data, error } = await supabase.functions.invoke('auto-sync-appointments', {
      body: {}
    });

    if (error) {
      console.error('Error triggering sync:', error);
      return { success: false, error };
    }

    console.log('Sync completed:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error calling sync function:', error);
    return { success: false, error };
  }
};