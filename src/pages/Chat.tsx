import React, { useState, useEffect } from 'react';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const { isCometChatReady } = useCometChat();
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState<CometChat.User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch current user and team members
  useEffect(() => {
    if (!isCometChatReady) return;

    const fetchData = async () => {
      try {
        // Get logged in user
        const loggedInUser = await CometChat.getLoggedinUser();
        setCurrentUser(loggedInUser);

        if (!loggedInUser) return;

        // Fetch real team members from Supabase
        const { data: teamMembers, error } = await supabase
          .from('team_members')
          .select('user_id, full_name')
          .neq('user_id', loggedInUser.getUid());

        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }

        // Fetch only these specific users from CometChat
        const realUsers: CometChat.User[] = [];
        for (const member of teamMembers || []) {
          try {
            const user = await CometChat.getUser(member.user_id);
            realUsers.push(user);
          } catch (err) {
            console.log(`User ${member.user_id} not found in CometChat`);
          }
        }

        setUsers(realUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchData();
  }, [isCometChatReady]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const messagesRequest = new CometChat.MessagesRequestBuilder()
          .setUID(selectedUser.getUid())
          .setLimit(50)
          .build();
        
        const messagesList = await messagesRequest.fetchPrevious();
        setMessages(messagesList);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Listen for new messages
    const listenerID = `chat_${selectedUser.getUid()}`;
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          if (message.getSender().getUid() === selectedUser.getUid()) {
            setMessages(prev => [...prev, message]);
          }
        },
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;

    setLoading(true);
    try {
      const textMessage = new CometChat.TextMessage(
        selectedUser.getUid(),
        messageText.trim(),
        CometChat.RECEIVER_TYPE.USER
      );

      const sentMessage = await CometChat.sendMessage(textMessage);
      setMessages(prev => [...prev, sentMessage]);
      setMessageText('');
      
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isCometChatReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Connecting to chat service...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Chat with your team in real-time
          </p>
        </div>
      </div>

      <Card className="flex-1 flex overflow-hidden">
        {/* Users List */}
        <div className="w-80 border-r border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-240px)]">
            {users.map((user) => (
              <div
                key={user.getUid()}
                onClick={() => setSelectedUser(user)}
                className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                  selectedUser?.getUid() === user.getUid() ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user.getName().charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.getName()}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.getStatus()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {selectedUser.getName().charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUser.getName()}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedUser.getStatus()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.getSender().getUid() === currentUser?.getUid();
                    const textMessage = message as CometChat.TextMessage;
                    
                    return (
                      <div
                        key={message.getId()}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent'
                          }`}
                        >
                          <p className="text-sm">{textMessage.getText()}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.getSentAt() * 1000).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || loading}
                    size="icon"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Chat;
