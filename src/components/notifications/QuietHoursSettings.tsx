import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationPreferences } from '@/types/notificationTypes';

interface QuietHoursSettingsProps {
  preferences: NotificationPreferences;
}

export const QuietHoursSettings = ({ preferences }: QuietHoursSettingsProps) => {
  const { updateQuietHours } = useNotificationPreferences();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Label htmlFor="quiet-hours-toggle" className="text-sm font-medium">
            Enable Quiet Hours
          </Label>
          <p className="text-xs text-muted-foreground">
            Pause notifications during specified hours
          </p>
        </div>
        <Switch
          id="quiet-hours-toggle"
          checked={preferences.quiet_hours_enabled}
          onCheckedChange={(checked) => updateQuietHours(checked)}
        />
      </div>

      {preferences.quiet_hours_enabled && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
              Start Time
            </Label>
            <Input
              id="quiet-start"
              type="time"
              value={preferences.quiet_hours_start}
              onChange={(e) =>
                updateQuietHours(
                  preferences.quiet_hours_enabled,
                  e.target.value,
                  preferences.quiet_hours_end
                )
              }
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
              End Time
            </Label>
            <Input
              id="quiet-end"
              type="time"
              value={preferences.quiet_hours_end}
              onChange={(e) =>
                updateQuietHours(
                  preferences.quiet_hours_enabled,
                  preferences.quiet_hours_start,
                  e.target.value
                )
              }
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};
