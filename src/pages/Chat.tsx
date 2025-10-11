import { useCometChat } from '@/hooks/useCometChat';
import { CometChatConversations, CometChatMessageList, CometChatMessageComposer } from '@cometchat/chat-uikit-react';
import { Card } from '@/components/ui/card';
import { MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const Chat = () => {
  const { isCometChatReady } = useCometChat();
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CometChat.Group | null>(null);

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

  const handleConversationClick = (conversation: any) => {
    if (conversation.conversationType === 'user') {
      setSelectedUser(conversation.conversationWith);
      setSelectedGroup(null);
    } else if (conversation.conversationType === 'group') {
      setSelectedGroup(conversation.conversationWith);
      setSelectedUser(null);
    }
  };

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

        {/* CometChat UI Kit Components */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Conversations Sidebar */}
            <div className="w-80 border-r">
              <CometChatConversations
                onItemClick={handleConversationClick}
              />
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser || selectedGroup ? (
                <>
                  <div className="flex-1 overflow-hidden">
                    <CometChatMessageList
                      user={selectedUser || undefined}
                      group={selectedGroup || undefined}
                    />
                  </div>
                  <div className="border-t">
                    <CometChatMessageComposer
                      user={selectedUser || undefined}
                      group={selectedGroup || undefined}
                    />
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
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
        </div>
      </div>
    </div>
  );
};

export default Chat;
