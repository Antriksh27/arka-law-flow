import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationPreferences, NOTIFICATION_EVENTS, CATEGORY_INFO, NotificationCategory } from '@/types/notificationTypes';

interface EventSettingsProps {
  preferences: NotificationPreferences;
}

export const EventSettings = ({ preferences }: EventSettingsProps) => {
  const { toggleEvent } = useNotificationPreferences();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Object.keys(NOTIFICATION_EVENTS) as NotificationCategory[];

  // Filter events based on search
  const getFilteredEvents = (category: NotificationCategory) => {
    const events = NOTIFICATION_EVENTS[category];
    if (!searchQuery) return events;
    
    return events.filter(
      (event) =>
        event.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'normal':
        return 'bg-primary text-primary-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isEventEnabled = (eventId: string, defaultEnabled: boolean) => {
    const override = preferences.event_preferences[eventId];
    return override !== undefined ? override.enabled : defaultEnabled;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search 87 notification types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Event Categories */}
      <Accordion type="multiple" className="space-y-2">
        {categories.map((category) => {
          const filteredEvents = getFilteredEvents(category);
          if (filteredEvents.length === 0) return null;

          const categoryInfo = CATEGORY_INFO[category];
          const categoryPrefs = preferences.categories[category];

          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium">{categoryInfo.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {filteredEvents.length} events
                  </Badge>
                  {!categoryPrefs.enabled && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Category Disabled
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const enabled = isEventEnabled(event.id, event.defaultEnabled);

                    return (
                      <div
                        key={event.id}
                        className="flex items-start justify-between py-2 px-3 hover:bg-accent/50 rounded-md transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={event.id}
                              className="text-sm cursor-pointer"
                            >
                              {event.label}
                            </Label>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${getPriorityColor(event.defaultPriority)}`}
                            >
                              {event.defaultPriority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                        <Switch
                          id={event.id}
                          checked={enabled}
                          onCheckedChange={(checked) => toggleEvent(event.id, checked)}
                          disabled={!categoryPrefs.enabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {searchQuery && categories.every(cat => getFilteredEvents(cat).length === 0) && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No events found matching "{searchQuery}"
        </div>
      )}

      {/* Stats */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          <strong>87 event types</strong> organized into <strong>13 categories</strong>
        </p>
      </div>
    </div>
  );
};
