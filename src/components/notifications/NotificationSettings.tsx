import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Volume2, Monitor, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NotificationSounds from '@/lib/notificationSounds';
import BrowserNotifications from '@/lib/browserNotifications';
export const NotificationSettings: React.FC = () => {
  const {
    toast
  } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(NotificationSounds.isAudioEnabled());

  // Browser notification settings
  const [browserNotificationsSupported] = useState(BrowserNotifications.isNotificationSupported());
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(BrowserNotifications.getPermission() === 'granted');

  // Category preferences
  const [categoryPreferences, setCategoryPreferences] = useState({
    case: true,
    hearing: true,
    task: true,
    appointment: true,
    document: true,
    invoice: true,
    message: true,
    system: true
  });

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notification-category-preferences');
    if (savedPreferences) {
      try {
        setCategoryPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (preferences: typeof categoryPreferences) => {
    localStorage.setItem('notification-category-preferences', JSON.stringify(preferences));
    setCategoryPreferences(preferences);
  };

  // Handle sound toggle
  const handleSoundToggle = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    NotificationSounds.setEnabled(enabled);
    if (enabled) {
      // Test sound when enabling
      await NotificationSounds.testSound();
      toast({
        title: 'Sound Enabled',
        description: 'Notification sounds are now active'
      });
    } else {
      toast({
        title: 'Sound Disabled',
        description: 'Notification sounds are now muted'
      });
    }
  };

  // Handle browser notifications toggle
  const handleBrowserNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await BrowserNotifications.requestPermission();
      setBrowserNotificationsEnabled(granted);
      if (granted) {
        // Test notification
        await BrowserNotifications.test();
        toast({
          title: 'Browser Notifications Enabled',
          description: 'You will now receive desktop notifications'
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive'
        });
      }
    } else {
      setBrowserNotificationsEnabled(false);
      toast({
        title: 'Browser Notifications Disabled',
        description: 'Desktop notifications are now off'
      });
    }
  };

  // Handle category toggle
  const handleCategoryToggle = (category: keyof typeof categoryPreferences, enabled: boolean) => {
    const newPreferences = {
      ...categoryPreferences,
      [category]: enabled
    };
    savePreferences(newPreferences);
    toast({
      title: enabled ? 'Category Enabled' : 'Category Disabled',
      description: `${category.charAt(0).toUpperCase() + category.slice(1)} notifications ${enabled ? 'enabled' : 'disabled'}`
    });
  };

  // Test all notification types
  const handleTestAllNotifications = async () => {
    toast({
      title: 'Testing Notifications',
      description: 'Playing test sound and showing browser notification...'
    });

    // Test sound
    if (soundEnabled) {
      await NotificationSounds.testSound();
    }

    // Test browser notification
    if (browserNotificationsEnabled) {
      await BrowserNotifications.test();
    }
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sound Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Sound Notifications</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sound-enabled">Enable notification sounds</Label>
                <p className="text-sm text-muted-foreground">
                  Play audio alerts when you receive notifications
                </p>
              </div>
              <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
            </div>
          </div>

          <Separator />

          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Browser Notifications</h3>
            </div>
            {browserNotificationsSupported ? <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="browser-notifications">Enable desktop notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications even when the browser is in the background
                  </p>
                </div>
                <Switch id="browser-notifications" checked={browserNotificationsEnabled} onCheckedChange={handleBrowserNotificationsToggle} />
              </div> : <p className="text-sm text-muted-foreground">
                Browser notifications are not supported in your browser
              </p>}
          </div>

          <Separator />

          {/* Category Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Notification Categories</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose which types of notifications you want to receive
            </p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(categoryPreferences).map(([category, enabled]) => <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor={`category-${category}`} className="capitalize">
                    {category}
                  </Label>
                  <Switch id={`category-${category}`} checked={enabled} onCheckedChange={checked => handleCategoryToggle(category as keyof typeof categoryPreferences, checked)} />
                </div>)}
            </div>
          </div>

          <Separator />

          {/* Test Button */}
          <div className="flex justify-end">
            <Button onClick={handleTestAllNotifications} variant="outline">
              <Bell className="w-4 h-4 mr-2" />
              Test All Notifications
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default NotificationSettings;