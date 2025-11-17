import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, Bell, Clock, Volume2, Mail } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { CategorySettings } from './CategorySettings';
import { EventSettings } from './EventSettings';
import { QuietHoursSettings } from './QuietHoursSettings';
import { DigestSettings } from './DigestSettings';
import { DeliveryChannelSettings } from './DeliveryChannelSettings';

export const NotificationSettingsPanel = () => {
  const { preferences, isLoading, toggleGlobal } = useNotificationPreferences();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Failed to load preferences</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global Toggle */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <Label htmlFor="global-toggle" className="text-base font-semibold">
                Master Control
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Enable or disable all notifications at once
            </p>
          </div>
          <Switch
            id="global-toggle"
            checked={preferences.enabled}
            onCheckedChange={toggleGlobal}
          />
        </div>
      </Card>

      {/* Settings Accordion */}
      <Card className="p-6">
        <Accordion type="multiple" className="space-y-4" defaultValue={['delivery', 'categories']}>
          <AccordionItem value="delivery" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-medium">Delivery Channels</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <DeliveryChannelSettings preferences={preferences} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="quiet-hours" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Quiet Hours</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <QuietHoursSettings preferences={preferences} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="digest" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">Email Digest</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <DigestSettings preferences={preferences} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="categories" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Categories (12)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <CategorySettings preferences={preferences} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="events" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-medium">Event Types (87)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <EventSettings preferences={preferences} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Save Notice */}
      <Card className="p-4 bg-accent/50">
        <p className="text-xs text-center text-muted-foreground">
          All changes are saved automatically
        </p>
      </Card>
    </div>
  );
};
