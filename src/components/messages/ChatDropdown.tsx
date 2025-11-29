import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useCometChat } from '@/hooks/useCometChat';
import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Chat {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: boolean;
  lastMessageId?: string;
  lastMessageSenderId?: string;
}

export const ChatDropdown = () => {
  const navigate = useNavigate();
  const { isCometChatReady } = useCometChat();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchRecentChats = async () => {
    if (!isCometChatReady) {
      setLoading(false);
      return;
    }

    try {
      const limit = 5;
      const conversationsRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(limit)
        .build();
      const conversationList = await conversationsRequest.fetchNext();

      let totalUnread = 0;
      const formattedChats: Chat[] = conversationList.map((conversation: any) => {
        const conversationWith = conversation.getConversationWith();
        const lastMessage = conversation.getLastMessage();
        const unreadCount = conversation.getUnreadMessageCount();
        totalUnread += unreadCount;

        return {
          id: conversation.getConversationId(),
          name: conversationWith.getName(),
          message: lastMessage?.getText() || 'No messages yet',
          time: lastMessage
            ? formatDistanceToNow(new Date(lastMessage.getSentAt() * 1000), {
                addSuffix: true,
              })
            : 'Just now',
          unread: unreadCount > 0,
          lastMessageId: lastMessage?.getId(),
          lastMessageSenderId: lastMessage?.getSender()?.getUid(),
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
    fetchRecentChats();
  }, [isCometChatReady]);

  // Real-time message listener
  useEffect(() => {
    if (!isCometChatReady) return;

    const listenerID = 'chat_dropdown_listener';

    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: (message: CometChat.TextMessage) => {
        console.log('New message received in dropdown:', message);
        fetchRecentChats();
      },
      onMediaMessageReceived: (message: CometChat.MediaMessage) => {
        console.log('New media message received in dropdown:', message);
        fetchRecentChats();
      },
    });

    CometChat.addMessageListener(listenerID, messageListener);

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, [isCometChatReady]);

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

      // Mark the message as read with all required parameters
      await CometChat.markAsRead(
        chat.lastMessageId, 
        chat.lastMessageSenderId, 
        'user', 
        currentUser.getUid()
      );
      
      console.log('Marked as read - Message ID:', chat.lastMessageId);
      
      // Refresh chat list to update unread counts
      setTimeout(() => fetchRecentChats(), 500);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleChatClick = async (chat: Chat) => {
    await markAsRead(chat);
    setOpen(false);
    
    // Check if this is a case group chat
    if (chat.id.startsWith('case_group_')) {
      const caseId = chat.id.replace('case_group_', '');
      navigate(`/cases/${caseId}?tab=chat`);
    } else {
      navigate('/chat');
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/chat');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-gray-50 hover:bg-gray-200 text-gray-900"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Messages</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            onClick={handleViewAll}
          >
            View All
          </Button>
        </div>
        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recent chats</p>
            </div>
          ) : (
            <div className="p-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleChatClick(chat)}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(chat.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{chat.name}</h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {chat.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.message}
                    </p>
                  </div>
                  {chat.unread && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
