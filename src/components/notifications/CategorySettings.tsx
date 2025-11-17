import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Gavel, Calendar, CheckSquare, FileText, Receipt, 
  MessageSquare, Users, UserPlus, StickyNote, Globe, Newspaper, Shield 
} from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationPreferences, CATEGORY_INFO, NotificationCategory } from '@/types/notificationTypes';

interface CategorySettingsProps {
  preferences: NotificationPreferences;
}

const CATEGORY_ICONS: Record<NotificationCategory, any> = {
  case: Briefcase,
  hearing: Gavel,
  appointment: Calendar,
  task: CheckSquare,
  document: FileText,
  invoice: Receipt,
  message: MessageSquare,
  client: Users,
  team: UserPlus,
  note: StickyNote,
  ecourts: Globe,
  legal_news: Newspaper,
  system: Shield,
};

export const CategorySettings = ({ preferences }: CategorySettingsProps) => {
  const { toggleCategory, updateCategoryFrequency, updateCategoryPriorityFilter } = useNotificationPreferences();

  const categories = Object.keys(CATEGORY_INFO) as NotificationCategory[];

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const categoryData = CATEGORY_INFO[category];
        const categoryPrefs = preferences.categories[category];

        return (
          <div
            key={category}
            className="space-y-3 p-4 border rounded-lg bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Icon className="h-5 w-5 mt-0.5 text-primary" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${category}-toggle`} className="text-sm font-medium cursor-pointer">
                      {categoryData.label}
                    </Label>
                    {!categoryPrefs.enabled && (
                      <Badge variant="outline" className="text-xs">Off</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{categoryData.description}</p>
                </div>
              </div>
              <Switch
                id={`${category}-toggle`}
                checked={categoryPrefs.enabled}
                onCheckedChange={(checked) => toggleCategory(category, checked)}
              />
            </div>

            {categoryPrefs.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select
                    value={categoryPrefs.frequency}
                    onValueChange={(value) => updateCategoryFrequency(category, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">⚡ Instant</SelectItem>
                      <SelectItem value="digest">📧 Digest</SelectItem>
                      <SelectItem value="off">🔕 Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority Filter</Label>
                  <Select
                    value={categoryPrefs.priority_filter}
                    onValueChange={(value) => updateCategoryPriorityFilter(category, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="normal">Normal & Above</SelectItem>
                      <SelectItem value="high">High & Urgent Only</SelectItem>
                      <SelectItem value="urgent">Urgent Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
