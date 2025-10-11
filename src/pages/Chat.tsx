import React, { useState } from 'react';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChatConversations, CometChatMessageList } from '@cometchat/chat-uikit-react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Loader2 } from 'lucide-react';

const Chat = () => {
  const { isCometChatReady } = useCometChat();
  const [selectedConversation, setSelectedConversation] = useState<CometChat.Conversation | null>(null);

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
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {/* Conversations List */}
      <div style={{ width: '320px', borderRight: '1px solid #e5e7eb' }}>
        <CometChatConversations
          onItemClick={(conversation) => {
            setSelectedConversation(conversation);
          }}
        />
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1 }}>
        {selectedConversation ? (
          <CometChatMessageList
            user={selectedConversation.getConversationType() === 'user' ? selectedConversation.getConversationWith() as CometChat.User : undefined}
            group={selectedConversation.getConversationType() === 'group' ? selectedConversation.getConversationWith() as CometChat.Group : undefined}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: '#6b7280' }}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
