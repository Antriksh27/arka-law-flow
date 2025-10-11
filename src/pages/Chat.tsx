import React, { useState } from 'react';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChat } from '@/lib/cometchat';
import { ChatUserList } from '@/components/chat/ChatUserList';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Loader2, AlertCircle } from 'lucide-react';

const Chat = () => {
  const { isCometChatReady, cometChatUser } = useCometChat();
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);

  if (!isCometChatReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="p-8 max-w-md w-full space-y-4 shadow-lg">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">Connecting to chat service...</h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we establish a secure connection.
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check your internet connection</li>
                  <li>Open browser console (F12) for detailed logs</li>
                  <li>Verify CometChat credentials in src/lib/cometchat.ts</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-background">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Team Chat</h1>
              <p className="text-sm text-muted-foreground">
                Connect with your team
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full p-4">
            <Card className="h-full overflow-hidden shadow-md">
              <div className="flex h-full">
                {/* Users sidebar */}
                <div className="w-80 border-r bg-card">
                  <ChatUserList
                    onSelectUser={setSelectedUser}
                    selectedUserId={selectedUser?.getUid() || null}
                  />
                </div>

                {/* Chat area */}
                <div className="flex-1 flex flex-col bg-background">
                  {selectedUser ? (
                    <>
                      {/* Chat header */}
                      <div className="px-6 py-4 border-b bg-card">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {selectedUser.getName().charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{selectedUser.getName()}</h3>
                            <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                              {selectedUser.getStatus() === 'online' && (
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                              )}
                              {selectedUser.getStatus()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-hidden">
                        <ChatMessageList
                          selectedUser={selectedUser}
                          currentUserId={cometChatUser?.getUid() || ''}
                        />
                      </div>

                      {/* Input */}
                      <div className="p-4 border-t bg-card">
                        <ChatInput selectedUser={selectedUser} />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-4 p-8">
                        <div className="flex justify-center">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageCircle className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Select a conversation</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Choose a team member from the list to start messaging
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
