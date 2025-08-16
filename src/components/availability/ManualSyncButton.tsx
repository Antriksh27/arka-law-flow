import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const ManualSyncButton: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    
    try {
      // Call the queue processor edge function
      const { data, error } = await supabase.functions.invoke('process-calendar-sync-queue', {
        body: { manual: true }
      });

      if (error) throw error;

      toast({
        title: 'Sync Initiated',
        description: 'Google Calendar sync has been triggered. Check your calendar in a few moments.',
      });
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to trigger Google Calendar sync. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleManualSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <Calendar className="h-4 w-4" />
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </Button>
  );
};