import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Smartphone, Mail, Globe, Volume2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationPreferences } from '@/types/notificationTypes';

interface DeliveryChannelSettingsProps {
  preferences: NotificationPreferences;
}

export const DeliveryChannelSettings = ({ preferences }: DeliveryChannelSettingsProps) => {
  const { updateDeliveryChannels } = useNotificationPreferences();

  const channels = [
    {
      id: 'in_app',
      label: 'In-App Notifications',
      description: 'Show notifications within the application',
      icon: Smartphone,
    },
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Send notifications to your email address',
      icon: Mail,
    },
    {
      id: 'browser',
      label: 'Browser Notifications',
      description: 'Show desktop/browser push notifications',
      icon: Globe,
    },
    {
      id: 'sound',
      label: 'Sound Alerts',
      description: 'Play sound when receiving notifications',
      icon: Volume2,
    },
  ];

  return (
    <div className="space-y-4">
      {channels.map((channel) => {
        const Icon = channel.icon;
        const isEnabled = preferences.delivery_preferences[channel.id as keyof typeof preferences.delivery_preferences];

        return (
          <div key={channel.id} className="flex items-start justify-between py-3 border-b last:border-0">
            <div className="flex items-start gap-3 flex-1">
              <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor={channel.id} className="text-sm font-medium cursor-pointer">
                  {channel.label}
                </Label>
                <p className="text-xs text-muted-foreground">{channel.description}</p>
              </div>
            </div>
            <Switch
              id={channel.id}
              checked={isEnabled}
              onCheckedChange={(checked) =>
                updateDeliveryChannels({ [channel.id]: checked })
              }
            />
          </div>
        );
      })}
    </div>
  );
};
