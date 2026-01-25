import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CheckCheck, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface Chat {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: boolean;
  lastMessageId?: string;
  lastMessageSenderId?: string;
  conversationType?: 'user' | 'group';
}

interface MessagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessagesDialog: React.FC<MessagesDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isCometChatReady } = useCometChat();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRecentChats = async () => {
    if (!isCometChatReady) {
      setLoading(false);
      return;
    }

    try {
      const limit = 10;
      const conversationsRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(limit)
        .build();
      const conversationList = await conversationsRequest.fetchNext();

      let totalUnread = 0;
      const formattedChats: Chat[] = conversationList.map((conversation: any) => {
        const conversationWith = conversation.getConversationWith();
        const lastMessage = conversation.getLastMessage();
        const unreadCount = conversation.getUnreadMessageCount();
        const conversationType = conversation.getConversationType();
        totalUnread += unreadCount;

        let messageText = 'No messages yet';
        if (lastMessage) {
          if (typeof lastMessage.getText === 'function') {
            messageText = lastMessage.getText() || 'No messages yet';
          } else if (lastMessage.getType() === 'image') {
            messageText = '📷 Image';
          } else if (lastMessage.getType() === 'video') {
            messageText = '🎥 Video';
          } else if (lastMessage.getType() === 'audio') {
            messageText = '🎵 Audio';
          } else if (lastMessage.getType() === 'file') {
            messageText = '📎 File';
          } else if (lastMessage.getCategory() === 'action') {
            messageText = 'Action message';
          } else {
            messageText = 'New message';
          }
        }

        const senderName = conversationWith?.getName?.() || 'Unknown';

        return {
          id: conversation.getConversationId(),
          name: senderName,
          message: messageText,
          time: lastMessage
            ? formatDistanceToNow(new Date(lastMessage.getSentAt() * 1000), { addSuffix: true })
            : 'Just now',
          unread: unreadCount > 0,
          lastMessageId: lastMessage?.getId?.(),
          lastMessageSenderId: lastMessage?.getSender?.()?.getUid?.(),
          conversationType: conversationType,
        };
      });

      setChats(formattedChats);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentChats();
    }
  }, [isCometChatReady, isOpen]);

  useEffect(() => {
    if (!isCometChatReady || !isOpen) return;

    const listenerID = 'messages_dialog_listener';
    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: () => fetchRecentChats(),
      onMediaMessageReceived: () => fetchRecentChats(),
    });

    CometChat.addMessageListener(listenerID, messageListener);
    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, [isCometChatReady, isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const markAsRead = async (chat: Chat) => {
    if (!isCometChatReady || !chat.lastMessageId || !chat.lastMessageSenderId) return;
    
    try {
      const currentUser = await CometChat.getLoggedinUser();
      if (!currentUser) return;

      await CometChat.markAsRead(
        chat.lastMessageId, 
        chat.lastMessageSenderId, 
        'user', 
        currentUser.getUid()
      );
      
      setTimeout(() => fetchRecentChats(), 500);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleChatClick = async (chat: Chat) => {
    await markAsRead(chat);
    onClose();
    
    if (chat.id.startsWith('group_case_')) {
      const caseId = chat.id.replace('group_case_', '');
      navigate(`/cases/${caseId}?tab=chat`);
    } else {
      navigate('/chat');
    }
  };

  const markAllChatNotificationsAsRead = async () => {
    if (!user?.id || !isCometChatReady) return;

    try {
      for (const chat of chats) {
        if (chat.unread && chat.lastMessageId && chat.lastMessageSenderId) {
          try {
            const currentUser = await CometChat.getLoggedinUser();
            if (currentUser) {
              const receiverType = chat.conversationType || 'user';
              let receiverId = chat.lastMessageSenderId;
              
              if (receiverType === 'group') {
                receiverId = chat.id.replace('group_', '');
              }
              
              await CometChat.markAsRead(
                chat.lastMessageId,
                receiverId,
                receiverType,
                currentUser.getUid()
              );
            }
          } catch (error) {
            console.error('Error marking CometChat message as read:', error);
          }
        }
      }

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
        .in('notification_type', ['message_received', 'message_mention']);

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      
      setTimeout(() => fetchRecentChats(), 1000);
      
      toast({
        title: "Success",
        description: "All messages marked as read",
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark messages as read",
        variant: "destructive",
      });
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      { bg: 'bg-sky-100', text: 'text-sky-700' },
      { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      { bg: 'bg-violet-100', text: 'text-violet-700' },
      { bg: 'bg-amber-100', text: 'text-amber-700' },
      { bg: 'bg-rose-100', text: 'text-rose-700' },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 sticky top-0 z-10">
        <button 
          onClick={onClose}
          className="text-primary font-medium text-base active:opacity-70"
        >
          Close
        </button>
        <span className="font-semibold text-slate-900">Messages</span>
        <button 
          onClick={() => {
            onClose();
            navigate('/chat');
          }}
          className="text-primary font-semibold text-base active:opacity-70"
        >
          View All
        </button>
      </div>

      {/* iOS Drag Handle - Mobile only */}
      {isMobile && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full z-20" />
      )}

      {/* Mark All Read Bar */}
      {unreadCount > 0 && (
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </span>
          <button 
            onClick={markAllChatNotificationsAsRead}
            className="flex items-center gap-1.5 text-sm font-medium text-primary active:opacity-70"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      )}

      {/* Messages List */}
      <ScrollArea className="flex-1 bg-slate-50">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading messages...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No messages</h3>
              <p className="text-sm text-slate-500">Start a conversation with your team</p>
            </div>
          ) : (
            chats.map((chat) => {
              const avatarColor = getAvatarColor(chat.name);
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className={`bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
                    chat.unread ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className={`${avatarColor.bg} ${avatarColor.text} font-semibold`}>
                        {getInitials(chat.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-base truncate ${chat.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {chat.name}
                          </h4>
                          {chat.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {chat.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {chat.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Mobile: iOS-style bottom sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl bg-slate-50 overflow-hidden p-0"
          hideCloseButton
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        hideCloseButton 
        className="sm:max-w-[420px] p-0 gap-0 overflow-hidden max-h-[80vh]"
      >
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default MessagesDialog;
