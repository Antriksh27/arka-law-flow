import React from 'react';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChatConversationsWithMessages } from '@cometchat/chat-uikit-react';
import { Loader2 } from 'lucide-react';

const Chat = () => {
  const { isCometChatReady } = useCometChat();

  if (!isCometChatReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Connecting to chat service...
        </p>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          If this takes too long, check the browser console (F12) for error details.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <CometChatConversationsWithMessages />
    </div>
  );
};

export default Chat;
