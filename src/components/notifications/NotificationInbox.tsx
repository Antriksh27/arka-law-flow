import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, X, Check, Trash2, ExternalLink, Clock, Calendar, FileText, AlertCircle, Gavel, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id?: string;
  category: string;
  priority: string;
  action_url?: string;
  metadata?: any;
  read: boolean;
  created_at: string;
}

interface NotificationInboxProps {
  userId?: string;
}

const NotificationInbox: React.FC<NotificationInboxProps> = ({ userId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const effectiveUserId = userId || user?.id;

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', effectiveUserId, filter],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        if (filter === 'unread') {
          query = query.eq('read', false);
        } else {
          query = query.eq('category', filter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveUserId && isOpen,
  });

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    }

    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!effectiveUserId) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', effectiveUserId)
      .eq('read', false);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    
    toast({
      title: 'Success',
      description: 'All notifications marked as read',
    });
  };

  // Delete notification
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
  };

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'case':
        return <FolderOpen className="w-4 h-4" />;
      case 'hearing':
        return <Gavel className="w-4 h-4" />;
      case 'task':
        return <Clock className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'invoice':
        return <FileText className="w-4 h-4" />;
      case 'message':
        return <Bell className="w-4 h-4" />;
      case 'system':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-slate-50 text-slate-900 hover:bg-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="error" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 h-auto p-0">
              <TabsTrigger value="all" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Unread
              </TabsTrigger>
              <TabsTrigger value="case" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Cases
              </TabsTrigger>
              <TabsTrigger value="hearing" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Hearings
              </TabsTrigger>
              <TabsTrigger value="task" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Tasks
              </TabsTrigger>
            </TabsList>

            {/* Notifications List */}
            <ScrollArea className="h-[32rem]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30 animate-pulse" />
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-16 h-16 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="font-medium">No notifications</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-accent/30 border-l-4 border-primary' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-1 p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                          {getCategoryIcon(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                                {notification.priority === 'urgent' && (
                                  <Badge variant="error" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {notification.action_url && (
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => deleteNotification(notification.id, e)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default NotificationInbox;
