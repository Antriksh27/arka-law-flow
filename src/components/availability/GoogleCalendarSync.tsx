import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Calendar, Link, Unlink, Settings, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const GoogleCalendarSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'one_way' | 'two_way'>('one_way');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      toast({ title: 'Google Calendar connected successfully!' });
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({ title: 'Google Calendar disconnected' });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    // Simulate sync process
    setTimeout(() => {
      setIsSyncing(false);
      toast({ title: 'Calendar sync completed successfully!' });
    }, 3000);
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
              <Select value={syncDirection} onValueChange={(value) => setSyncDirection(value as 'one_way' | 'two_way')}>
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
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            {/* Sync Interval */}
            {autoSync && (
              <div className="space-y-2">
                <Label>Sync Interval</Label>
                <Select value={syncInterval.toString()} onValueChange={(value) => setSyncInterval(parseInt(value))}>
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
              <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
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