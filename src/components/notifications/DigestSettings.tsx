import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationPreferences } from '@/types/notificationTypes';

interface DigestSettingsProps {
  preferences: NotificationPreferences;
}

export const DigestSettings = ({ preferences }: DigestSettingsProps) => {
  const { updateDigestSettings } = useNotificationPreferences();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="digest-frequency" className="text-sm font-medium">
          Digest Frequency
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Group low-priority notifications into periodic emails
        </p>
        <Select
          value={preferences.digest_frequency}
          onValueChange={(value) => updateDigestSettings(value, preferences.digest_time)}
        >
          <SelectTrigger id="digest-frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never (Instant Only)</SelectItem>
            <SelectItem value="hourly">Every Hour</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {preferences.digest_frequency !== 'never' && (
        <div className="space-y-2">
          <Label htmlFor="digest-time" className="text-sm font-medium">
            Delivery Time
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            When to send the digest (for daily/weekly)
          </p>
          <Input
            id="digest-time"
            type="time"
            value={preferences.digest_time}
            onChange={(e) => updateDigestSettings(preferences.digest_frequency, e.target.value)}
            className="text-sm"
          />
        </div>
      )}

      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Digest mode batches notifications marked as "digest" frequency in
          category settings below. Urgent notifications always deliver instantly.
        </p>
      </div>
    </div>
  );
};
