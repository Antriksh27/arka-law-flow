import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inbox, Bell, Check, Trash2, Calendar, FileText, Clock, User, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id?: string;
  category?: string;
  priority?: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

export const NotificationInbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', user.id)
      .eq('read', false);
    
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    
    toast({
      title: 'All marked as read',
      description: 'All notifications have been marked as read.',
    });
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
  };

  // Handle notification click - navigate to reference
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on action_url or reference_id
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.reference_id) {
      // Determine route based on category
      switch (notification.category) {
        case 'case':
          navigate(`/cases/${notification.reference_id}`);
          break;
        case 'hearing':
          navigate('/hearings');
          break;
        case 'appointment':
          navigate('/appointments');
          break;
        case 'task':
          navigate('/tasks');
          break;
        case 'client':
          navigate(`/clients/${notification.reference_id}`);
          break;
        case 'document':
          navigate('/documents');
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'case':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'task':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'client':
        return <User className="w-4 h-4 text-primary" />;
      case 'hearing':
        return <Calendar className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error" className="text-xs">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning" className="text-xs">High</Badge>;
      default:
        return null;
    }
  };

  const renderNotificationList = (notifs: Notification[]) => {
    if (notifs.length === 0) {
      return (
        <div className="text-center py-12">
          <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            You're all caught up!
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 p-4">
          {notifs.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                !notification.read ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.category || 'system')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(notification.priority)}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card>
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Notifications</h2>
            {unreadNotifications.length > 0 && (
              <Badge variant="error">{unreadNotifications.length}</Badge>
            )}
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadNotifications.length > 0 && (
              <Badge variant="default" className="ml-2 text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="m-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            renderNotificationList(unreadNotifications)
          )}
        </TabsContent>

        <TabsContent value="all" className="m-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            renderNotificationList(notifications)
          )}
        </TabsContent>

        <TabsContent value="read" className="m-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            renderNotificationList(readNotifications)
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
