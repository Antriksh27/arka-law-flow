import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { triggerAppointmentSync } from '@/utils/syncAppointments';
import { toast } from 'sonner';

export const SyncAppointmentsButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log('Manual sync triggered...');
      const { data, error } = await triggerAppointmentSync();
      
      if (error) {
        console.error('Sync error:', error);
        toast.error('Failed to sync appointments');
      } else {
        console.log('Sync result:', data);
        toast.success(`Synced ${data.processed || 0} appointments successfully`);
        
        // Refresh the page to show new appointments
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error('Sync catch error:', err);
      toast.error('Failed to sync appointments');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Syncing...' : 'Sync Public Appointments'}
    </Button>
  );
};