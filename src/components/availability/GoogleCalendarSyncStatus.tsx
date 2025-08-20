import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncStatus {
  isConnected: boolean;
  lastSync: string | null;
  pendingItems: number;
  errorCount: number;
  lastError: string | null;
  syncEnabled: boolean;
}

export const GoogleCalendarSyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    pendingItems: 0,
    errorCount: 0,
    lastError: null,
    syncEnabled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSyncStatus();
    
    // Set up real-time subscription for sync queue changes
    const subscription = supabase
      .channel('sync-status')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'google_calendar_sync_queue' },
        () => {
          loadSyncStatus();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'google_calendar_settings' },
        () => {
          loadSyncStatus();
        }
      )
      .subscribe();

    // Refresh status every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get Google Calendar settings
      const { data: settings, error: settingsError } = await supabase
        .from('google_calendar_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      // Get pending queue items count
      const { count: pendingCount, error: queueError } = await supabase
        .from('google_calendar_sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .eq('processed', false);

      // Get recent error count (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { count: errorCount, error: errorCountError } = await supabase
        .from('google_calendar_sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .eq('processed', true)
        .not('error_message', 'is', null)
        .gte('processed_at', oneHourAgo.toISOString());

      // Get last error
      const { data: lastErrorItem, error: lastErrorError } = await supabase
        .from('google_calendar_sync_queue')
        .select('error_message, processed_at')
        .eq('user_id', user.user.id)
        .not('error_message', 'is', null)
        .order('processed_at', { ascending: false })
        .limit(1)
        .single();

      setSyncStatus({
        isConnected: !!settings?.access_token,
        lastSync: settings?.last_sync_at || null,
        pendingItems: pendingCount || 0,
        errorCount: errorCount || 0,
        lastError: lastErrorItem?.error_message || null,
        syncEnabled: settings?.sync_enabled || false
      });

    } catch (error) {
      console.error('Error loading sync status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger manual sync processing
      const { data, error } = await supabase.functions.invoke('process-calendar-sync-queue', {
        body: { manual: true }
      });

      if (error) throw error;

      toast({
        title: 'Sync Refreshed',
        description: 'Google Calendar sync queue has been processed.',
      });

      // Reload status after a short delay
      setTimeout(loadSyncStatus, 1000);
    } catch (error) {
      console.error('Error refreshing sync:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh sync status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getSyncStatusColor = () => {
    if (!syncStatus.isConnected || !syncStatus.syncEnabled) return 'text-gray-500';
    if (syncStatus.errorCount > 0) return 'text-red-500';
    if (syncStatus.pendingItems > 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus.isConnected || !syncStatus.syncEnabled) return WifiOff;
    if (syncStatus.errorCount > 0) return AlertCircle;
    if (syncStatus.pendingItems > 0) return Clock;
    return CheckCircle;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getSyncStatusIcon();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${getSyncStatusColor()}`} />
          Google Calendar Sync Status
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Connection</div>
            <div className="flex items-center gap-1">
              {syncStatus.isConnected ? (
                <Badge variant="success" className="text-xs">Connected</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Disconnected</Badge>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">Last Sync</div>
            <div className="font-medium">{formatLastSync(syncStatus.lastSync)}</div>
          </div>
          
          <div>
            <div className="text-muted-foreground">Pending</div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{syncStatus.pendingItems}</span>
              {syncStatus.pendingItems > 0 && (
                <Clock className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">Recent Errors</div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{syncStatus.errorCount}</span>
              {syncStatus.errorCount > 0 && (
                <AlertCircle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {syncStatus.lastError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <div className="font-medium text-red-800">Last Error:</div>
            <div className="text-red-700">{syncStatus.lastError}</div>
          </div>
        )}

        {!syncStatus.isConnected && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="font-medium text-yellow-800">Not Connected</div>
            <div className="text-yellow-700">Connect Google Calendar to enable automatic sync</div>
          </div>
        )}

        {syncStatus.isConnected && !syncStatus.syncEnabled && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="font-medium text-yellow-800">Sync Disabled</div>
            <div className="text-yellow-700">Google Calendar sync is currently disabled</div>
          </div>
        )}

        {syncStatus.isConnected && syncStatus.syncEnabled && syncStatus.pendingItems === 0 && syncStatus.errorCount === 0 && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="font-medium text-green-800">All Synced</span>
            </div>
            <div className="text-green-700">Your appointments are automatically syncing every 15 seconds</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};