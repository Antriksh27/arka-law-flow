
import React, { useState, useMemo } from 'react';
import DefaultPageLayout from '@/components/messages/ui/DefaultPageLayout';
import { ChatSidebar } from '@/components/messages/ChatSidebar';
import { ChatView } from '@/components/messages/ChatView';
import { NewChatDialog } from '@/components/messages/NewChatDialog';
import { useThreads } from '@/hooks/use-threads';

const MessagesPage: React.FC = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const { data: threadsData } = useThreads();

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleNewChatCreated = (threadId: string) => {
    setSelectedThreadId(threadId);
    setIsNewChatOpen(false);
  };
  
  const selectedThreadData = useMemo(() => {
    if (!selectedThreadId || !threadsData) return null;
    const allThreads = [...(threadsData.directMessages || []), ...(threadsData.caseChannels || [])];
    return allThreads.find(t => t.id === selectedThreadId);
  }, [selectedThreadId, threadsData]);

  return (
    <DefaultPageLayout>
      <NewChatDialog 
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        onChatCreated={handleNewChatCreated}
      />
      <div className="flex h-full w-full items-start">
        <ChatSidebar
          selectedThreadId={selectedThreadId}
          onSelectThread={handleSelectThread}
          onNewChat={() => setIsNewChatOpen(true)}
        />
        <ChatView 
            threadId={selectedThreadId}
            threadData={selectedThreadData}
        />
      </div>
    </DefaultPageLayout>
  );
};

export default MessagesPage;

