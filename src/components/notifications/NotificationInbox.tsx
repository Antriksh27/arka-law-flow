import { Card } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

export const NotificationInbox = () => {
  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No notifications</h3>
        <p className="text-sm text-muted-foreground">
          You're all caught up! Check back later for new notifications.
        </p>
      </div>
    </Card>
  );
};
