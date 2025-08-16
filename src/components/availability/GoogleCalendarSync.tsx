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

export const GoogleCalendarSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncDirection, setSyncDirection] = useState<'one_way' | 'two_way'>('one_way');
  const [autoSync, setAutoSync] = useState(false);
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
      // Call edge function to get Google OAuth URL
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'get_auth_url' }
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
      // Call edge function to sync appointments
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          action: 'sync_appointments',
          settings: {
            calendar_id: settings?.calendar_id,
            access_token: settings?.access_token
          }
        }
      });

      if (error) throw error;

      toast({ 
        title: 'Sync Completed', 
        description: `Successfully synced ${data.synced_count || 0} appointments.`
      });
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast({ 
        title: 'Sync Failed', 
        description: 'Failed to sync calendar. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
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
    
    if (code && !isConnected) {
      handleOAuthCallback(code);
    }
  }, [isConnected]);

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'handle_callback',
          code: code
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

            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Sync</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync appointments at regular intervals
                </div>
              </div>
              <Switch 
                checked={autoSync} 
                onCheckedChange={(checked) => {
                  setAutoSync(checked);
                  updateSettings({ auto_sync: checked });
                }} 
              />
            </div>

            {/* Sync Interval */}
            {autoSync && (
              <div className="space-y-2">
                <Label>Sync Interval</Label>
                <Select 
                  value={syncInterval.toString()} 
                  onValueChange={(value) => {
                    const newInterval = parseInt(value);
                    setSyncInterval(newInterval);
                    updateSettings({ sync_interval_minutes: newInterval });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                    <SelectItem value="120">Every 2 hours</SelectItem>
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
                checked={syncEnabled} 
                onCheckedChange={(checked) => {
                  setSyncEnabled(checked);
                  updateSettings({ sync_enabled: checked });
                }} 
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