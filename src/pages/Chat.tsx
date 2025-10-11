import React, { useState, useEffect } from 'react';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChat } from '@/lib/cometchat';
import { ChatUserList } from '@/components/chat/ChatUserList';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { Card } from '@/components/ui/card';
import { MessageCircle, Loader2 } from 'lucide-react';

const Chat = () => {
  const { isCometChatReady, cometChatUser } = useCometChat();
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);

  if (!isCometChatReady) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-[600px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Connecting to chat service...
          </p>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            If this takes too long, check the browser console (F12) for error details.
          </p>
          <div className="mt-4 p-4 bg-accent rounded-lg max-w-md">
            <p className="text-xs text-muted-foreground">
              <strong>Troubleshooting:</strong> Open browser console (F12) to see detailed error messages.
              Common issues:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Incorrect APP_ID or AUTH_KEY in src/lib/cometchat.ts</li>
              <li>Wrong REGION (should be us, eu, or in)</li>
              <li>APP_ID doesn't exist in the specified region</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Real-time chat with your team and clients
          </p>
        </div>
      </div>

      <Card className="h-[calc(100vh-200px)] flex overflow-hidden shadow-sm">
        {/* Sidebar - User List */}
        <div className="w-80 border-r border-border flex-shrink-0">
          <ChatUserList
            onSelectUser={setSelectedUser}
            selectedUserId={selectedUser?.getUid() || null}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {selectedUser.getName().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedUser.getName()}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedUser.getStatus()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ChatMessageList
                selectedUser={selectedUser}
                currentUserId={cometChatUser?.getUid() || ''}
              />

              {/* Input */}
              <ChatInput selectedUser={selectedUser} />
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
