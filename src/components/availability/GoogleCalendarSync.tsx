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
import { useAuth } from '@/contexts/AuthContext';

interface GoogleCalendarSettings {
  id?: string;
  user_id: string;
  access_token?: string;
  refresh_token?: string;
  calendar_id?: string;
  sync_enabled: boolean;
  sync_direction: 'one_way' | 'two_way';
  auto_sync: boolean;
  sync_interval_minutes: number;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface CalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

export const GoogleCalendarSync = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('google_calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...data,
          sync_direction: data.sync_direction as 'one_way' | 'two_way'
        });
        setIsConnected(!!data.access_token);
        if (data.access_token) {
          loadCalendars(data.access_token);
        }
      }
    } catch (error) {
      console.error('Error loading Google Calendar settings:', error);
    }
  };

  const loadCalendars = async (accessToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'list_calendars',
          access_token: accessToken
        }
      });

      if (error) throw error;

      if (data?.calendars) {
        setCalendars(data.calendars);
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_auth_url',
          redirect_uri: `${window.location.origin}/availability`
        }
      });

      if (error) throw error;

      if (data?.auth_url) {
        // Open popup window for Google OAuth
        const popup = window.open(
          data.auth_url,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the popup to close or send a message
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            // Check if authentication was successful
            loadSettings();
          }
        }, 1000);

        // Listen for messages from the popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
            popup?.close();
            clearInterval(checkClosed);
            setIsConnecting(false);
            setIsConnected(true);
            toast({ title: 'Google Calendar connected successfully!' });
            loadSettings();
            window.removeEventListener('message', messageHandler);
          } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
            popup?.close();
            clearInterval(checkClosed);
            setIsConnecting(false);
            toast({ 
              title: 'Failed to connect Google Calendar', 
              description: event.data.error || 'Authentication failed',
              variant: 'destructive' 
            });
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setIsConnecting(false);
      toast({ 
        title: 'Connection failed', 
        description: 'Failed to initiate Google Calendar connection',
        variant: 'destructive' 
      });
    }
  };

  const handleDisconnect = async () => {
    if (!settings?.id) return;

    try {
      const { error } = await supabase
        .from('google_calendar_settings')
        .delete()
        .eq('id', settings.id);

      if (error) throw error;

      setIsConnected(false);
      setSettings(null);
      setCalendars([]);
      toast({ title: 'Google Calendar disconnected' });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({ 
        title: 'Disconnection failed',
        description: 'Failed to disconnect Google Calendar',
        variant: 'destructive' 
      });
    }
  };

  const handleSync = async () => {
    if (!settings?.access_token) return;

    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'sync_appointments',
          user_id: user?.id,
          settings
        }
      });

      if (error) throw error;

      setLastSyncStatus('success');
      toast({ title: 'Calendar sync completed successfully!' });
      
      // Update last sync time
      await supabase
        .from('google_calendar_settings')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', settings.id);
        
      loadSettings();
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setLastSyncStatus('error');
      toast({ 
        title: 'Sync failed',
        description: 'Failed to sync with Google Calendar',
        variant: 'destructive' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSettings = async (updates: Partial<GoogleCalendarSettings>) => {
    if (!settings?.id) return;

    try {
      const { error } = await supabase
        .from('google_calendar_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast({ title: 'Settings updated successfully' });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ 
        title: 'Update failed',
        description: 'Failed to update sync settings',
        variant: 'destructive' 
      });
    }
  };

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
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
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

          {/* Last Sync Status */}
          {isConnected && settings?.last_sync_at && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {lastSyncStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : lastSyncStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : null}
              <span className="text-sm text-muted-foreground">
                Last synced: {new Date(settings.last_sync_at).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      {isConnected && settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sync Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar Selection */}
            {calendars.length > 0 && (
              <div className="space-y-2">
                <Label>Select Calendar</Label>
                <Select 
                  value={settings.calendar_id || ''} 
                  onValueChange={(value) => updateSettings({ calendar_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a calendar to sync with" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        <div className="flex items-center gap-2">
                          {calendar.summary}
                          {calendar.primary && <Badge variant="outline">Primary</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sync Direction */}
            <div className="space-y-2">
              <Label>Sync Direction</Label>
              <Select 
                value={settings.sync_direction} 
                onValueChange={(value) => updateSettings({ sync_direction: value as 'one_way' | 'two_way' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_way">
                    One-way (App → Google Calendar)
                  </SelectItem>
                  <SelectItem value="two_way">
                    Two-way (Bidirectional sync)
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {settings.sync_direction === 'one_way' 
                  ? 'Appointments from this app will be added to Google Calendar'
                  : 'Appointments will sync both ways between this app and Google Calendar'
                }
              </div>
            </div>

            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Sync</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync appointments at regular intervals
                </div>
              </div>
              <Switch
                checked={settings.auto_sync}
                onCheckedChange={(checked) => updateSettings({ auto_sync: checked })}
              />
            </div>

            {/* Sync Interval */}
            {settings.auto_sync && (
              <div className="space-y-2">
                <Label>Sync Interval</Label>
                <Select 
                  value={settings.sync_interval_minutes.toString()} 
                  onValueChange={(value) => updateSettings({ sync_interval_minutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                    <SelectItem value="120">Every 2 hours</SelectItem>
                    <SelectItem value="240">Every 4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Enable/Disable Sync */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label>Enable Sync</Label>
                <div className="text-sm text-muted-foreground">
                  Turn sync on or off for this calendar
                </div>
              </div>
              <Switch
                checked={settings.sync_enabled}
                onCheckedChange={(checked) => updateSettings({ sync_enabled: checked })}
              />
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
            <div>
              <strong>One-way sync:</strong> Your app appointments will appear in Google Calendar, but changes in Google Calendar won't affect your app.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <strong>Two-way sync:</strong> Appointments sync both ways. Changes in either calendar will update the other.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <strong>Automatic sync:</strong> When enabled, your calendars will sync automatically at the interval you choose.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <strong>Privacy:</strong> Only appointment times and titles are synced. Client details remain private in your app.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};