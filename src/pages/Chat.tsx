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
        const loggedInUser = await CometChat.getLoggedinUser();
        setCurrentUser(loggedInUser);
        if (!loggedInUser) return;

        // Fetch real team members from Supabase
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id, full_name')
          .neq('user_id', loggedInUser.getUid());

        // Fetch only real users from CometChat
        const realUsers: CometChat.User[] = [];
        for (const member of teamMembers || []) {
          try {
            const user = await CometChat.getUser(member.user_id);
            realUsers.push(user);
          } catch (err) {
            console.log(`User ${member.user_id} not in CometChat yet`);
          }
        }
        setUsers(realUsers);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, [isCometChatReady]);

  // Fetch messages when user selected
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

    return () => CometChat.removeMessageListener(listenerID);
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
    } catch (error) {
      toast({
        title: 'Failed to send',
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
        <p className="text-lg">Connecting to chat...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Team Chat</h1>
          <p className="text-sm text-muted-foreground">Real-time messaging</p>
        </div>
      </div>

      <Card className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Team Members</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-240px)]">
            {users.map((user) => (
              <div
                key={user.getUid()}
                onClick={() => setSelectedUser(user)}
                className={`p-4 cursor-pointer hover:bg-accent ${
                  selectedUser?.getUid() === user.getUid() ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary/20">
                    <span className="text-primary font-semibold">
                      {user.getName().charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.getName()}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.getStatus()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b">
                <h3 className="font-semibold">{selectedUser.getName()}</h3>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.getSender().getUid() === currentUser?.getUid();
                    const textMsg = msg as CometChat.TextMessage;
                    
                    return (
                      <div key={msg.getId()} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                          <p className="text-sm">{textMsg.getText()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={sendMessage} disabled={!messageText.trim() || loading} size="icon">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a team member to chat</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Chat;
