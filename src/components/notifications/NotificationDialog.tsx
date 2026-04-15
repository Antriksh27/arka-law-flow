import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Clock, Calendar, FileText, User, Settings, CheckCheck } from 'lucide-react';
import TimeUtils from '@/lib/timeUtils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id?: string;
  read: boolean;
  created_at: string;
}

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : onClose;

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isOpen,
  });

  // Mark notification as read
  const markAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    const type = notification.notification_type;
    const refId = notification.reference_id;
    
    handleClose();
    
    if (!refId) return;
    
    if (type === 'hearing_scheduled' || type === 'hearing') {
      navigate(`/hearings?id=${refId}`);
    } else if (type === 'case_created' || type === 'case_status_changed' || type === 'case_assigned' || type === 'case') {
      navigate(`/cases/${refId}`);
    } else if (type === 'task_assigned' || type === 'task_completed' || type === 'task') {
      navigate(`/tasks?id=${refId}`);
    } else if (type === 'appointment') {
      navigate(`/appointments?id=${refId}`);
    } else if (type === 'client') {
      navigate(`/clients/${refId}`);
    } else if (type === 'document_uploaded' || type === 'document') {
      navigate(`/documents?id=${refId}`);
    } else if (type === 'case_chat') {
      navigate(`/cases/${refId}?tab=chat`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'appointment':
        return <Calendar className={`${iconClass} text-sky-600`} />;
      case 'hearing':
      case 'hearing_scheduled':
        return <Calendar className={`${iconClass} text-violet-600`} />;
      case 'case':
      case 'case_created':
      case 'case_status_changed':
      case 'case_assigned':
        return <FileText className={`${iconClass} text-emerald-600`} />;
      case 'task':
      case 'task_assigned':
      case 'task_completed':
        return <Clock className={`${iconClass} text-amber-600`} />;
      case 'client':
        return <User className={`${iconClass} text-rose-600`} />;
      default:
        return <Bell className={`${iconClass} text-slate-600`} />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-sky-50';
      case 'hearing':
      case 'hearing_scheduled':
        return 'bg-violet-50';
      case 'case':
      case 'case_created':
      case 'case_status_changed':
      case 'case_assigned':
        return 'bg-emerald-50';
      case 'task':
      case 'task_assigned':
      case 'task_completed':
        return 'bg-amber-50';
      case 'client':
        return 'bg-rose-50';
      default:
        return 'bg-slate-100';
    }
  };

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Notifications"
        onClose={handleClose}
        icon={<Bell className="w-5 h-5 text-primary" />}
        showBorder
      />

      {/* Mark All Read Bar */}
      {unreadCount > 0 && (
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm font-bold text-primary active:opacity-70"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Bell className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No notifications</h3>
              <p className="text-sm text-slate-500 font-medium">You'll see updates here when you have new activity</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer border border-border/50 ${
                  !notification.read ? 'ring-2 ring-primary/10 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl ${getIconBgColor(notification.notification_type)} flex items-center justify-center flex-shrink-0 border border-border/30`}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-[14px] text-slate-900 truncate ${!notification.read ? 'font-bold' : 'font-semibold'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 font-medium leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                          {TimeUtils.formatNotificationTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-white active:scale-90 transition-transform shadow-sm border border-slate-100"
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer for Desktop if needed, but here we just need a back/close interaction which header provides */}
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-[420px] p-0 gap-0 overflow-hidden max-h-[90vh] sm:max-h-[85vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;
