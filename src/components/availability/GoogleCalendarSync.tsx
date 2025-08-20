import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Calendar, Link, Unlink, Settings, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ManualSyncButton } from './ManualSyncButton';

export const GoogleCalendarSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'one_way' | 'two_way'>('one_way');
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(60);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Load user's Google Calendar settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('google_calendar_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
        setIsConnected(!!data.access_token);
        setSyncDirection(data.sync_direction as 'one_way' | 'two_way');
        setAutoSync(data.auto_sync);
        setSyncInterval(data.sync_interval_minutes);
        setSyncEnabled(data.sync_enabled);
        
        // Load calendars if connected but no calendar selected
        if (data.access_token && !data.calendar_id) {
          loadCalendars();
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Get current URL for redirect
      const redirectUri = window.location.origin + window.location.pathname;
      
      // Call edge function to get Google OAuth URL
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'get_auth_url',
          redirect_uri: redirectUri
        }
      });

      if (error) throw error;

      if (data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast({ 
        title: 'Connection Failed', 
        description: 'Failed to connect to Google Calendar. Please try again.',
        variant: 'destructive'
      });
      setIsConnecting(false);
    }
  };

  const handleReconnect = async () => {
    setIsConnecting(true);
    
    try {
      // First disconnect current connection
      await handleDisconnect();
      
      // Short delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then initiate new connection
      const redirectUri = window.location.origin + window.location.pathname;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'get_auth_url',
          redirect_uri: redirectUri
        }
      });

      if (error) throw error;
      
      toast({
        title: 'Reconnecting...',
        description: 'Redirecting to Google for re-authentication.',
      });
      
      if (data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error reconnecting to Google Calendar:', error);
      toast({ 
        title: 'Reconnection Failed', 
        description: 'Failed to reconnect to Google Calendar. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Delete Google Calendar settings
      const { error } = await supabase
        .from('google_calendar_settings')
        .delete()
        .eq('user_id', user.user.id);

      if (error) throw error;

      setIsConnected(false);
      setSettings(null);
      setCalendars([]);
      toast({ title: 'Google Calendar disconnected successfully!' });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({ 
        title: 'Disconnection Failed', 
        description: 'Failed to disconnect Google Calendar. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      // First check if we have valid settings and calendar_id
      if (!settings?.access_token) {
        throw new Error('Google Calendar not connected. Please connect first.');
      }
      
      if (!settings?.calendar_id) {
        throw new Error('No calendar selected. Please select a calendar in settings.');
      }

      // Call edge function to sync appointments
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          action: 'sync_appointments',
          user_id: user?.id
        }
      });

      if (error) {
        // Check if it's an auth error and suggest reconnection
        if (error.message?.includes('401') || error.message?.includes('authentication')) {
          throw new Error('Authentication expired. Please disconnect and reconnect Google Calendar.');
        }
        throw error;
      }

      // Update last sync time
      await updateSettings({ last_sync_at: new Date().toISOString() });

      toast({ 
        title: 'Sync Completed', 
        description: `Successfully synced ${data?.synced_count || 0} appointments.`
      });
      
      // Reload settings to get updated sync time
      await loadSettings();
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast({ 
        title: 'Sync Failed', 
        description: error instanceof Error ? error.message : 'Failed to sync calendar. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const loadCalendars = async () => {
    setLoadingCalendars(true);
    try {
      // First, get the user's access token from the database
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: settingsData, error: settingsError } = await supabase
        .from('google_calendar_settings')
        .select('access_token')
        .eq('user_id', user.user.id)
        .single();

      if (settingsError || !settingsData?.access_token) {
        throw new Error('Google Calendar not connected. Please connect first.');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          action: 'list_calendars',
          access_token: settingsData.access_token
        }
      });

      if (error) throw error;

      setCalendars(data.calendars || []);
    } catch (error) {
      console.error('Error loading calendars:', error);
      toast({
        title: 'Calendar Load Failed',
        description: 'Failed to load Google Calendars. Please try reconnecting.',
        variant: 'destructive'
      });
    } finally {
      setLoadingCalendars(false);
    }
  };

  const updateSettings = async (updates: Partial<any>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !settings) return;

      const { error } = await supabase
        .from('google_calendar_settings')
        .update(updates)
        .eq('user_id', user.user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ 
        title: 'Update Failed', 
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle OAuth callback if URL contains authorization code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code);
    }
  }, []); // Remove dependency on isConnected to prevent blocking

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    
    try {
      const redirectUri = window.location.origin + window.location.pathname;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'handle_callback',
          code: code,
          redirect_uri: redirectUri,
          state: new URLSearchParams(window.location.search).get('state')
        }
      });

      if (error) throw error;

      // Reload settings to get the updated connection status
      await loadSettings();
      
      toast({ title: 'Google Calendar connected successfully!' });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      toast({ 
        title: 'Connection Failed', 
        description: 'Failed to complete Google Calendar connection.',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading calendar settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <div className="font-medium">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isConnected 
                    ? 'Your Google Calendar is connected and ready to sync'
                    : 'Connect your Google Calendar to sync appointments'
                  }
                </div>
              </div>
            </div>
            
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSync}
                  disabled={isSyncing || !settings?.calendar_id}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <ManualSyncButton />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReconnect}
                  disabled={isConnecting}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                  {isConnecting ? 'Reconnecting...' : 'Reconnect'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDisconnect}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
              >
                <Link className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sync Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar Selection */}
            {!settings?.calendar_id && (
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <div className="font-medium text-orange-900">Calendar Selection Required</div>
                </div>
                <div className="text-sm text-orange-700 mb-3">
                  Please select a Google Calendar to sync with your appointments.
                </div>
                <div className="space-y-2">
                  <Label>Google Calendar</Label>
                  <div className="flex gap-2">
                    <Select 
                      onValueChange={(value) => {
                        updateSettings({ calendar_id: value });
                      }}
                      disabled={loadingCalendars}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={loadingCalendars ? "Loading calendars..." : "Select a calendar"} />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadCalendars}
                      disabled={loadingCalendars}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingCalendars ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Direction */}
            <div className="space-y-2">
              <Label>Sync Direction</Label>
              <Select 
                value={syncDirection} 
                onValueChange={(value) => {
                  const newDirection = value as 'one_way' | 'two_way';
                  setSyncDirection(newDirection);
                  updateSettings({ sync_direction: newDirection });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_way">One-way (App → Google Calendar)</SelectItem>
                  <SelectItem value="two_way">Two-way (Bidirectional sync)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Automatic Sync Status */}
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="font-medium text-green-900">Automatic Sync Enabled</div>
              </div>
              <div className="text-sm text-green-700 mt-1">
                Your appointments will automatically sync to Google Calendar every 15 seconds
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help & Information */}
      <Card>
        <CardHeader>
          <CardTitle>How Google Calendar Sync Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div><strong>One-way sync:</strong> Your app appointments will appear in Google Calendar, but changes in Google Calendar won't affect your app.</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div><strong>Two-way sync:</strong> Appointments sync both ways. Changes in either calendar will update the other.</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div><strong>Privacy:</strong> Only appointment times and titles are synced. Client details remain private in your app.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};