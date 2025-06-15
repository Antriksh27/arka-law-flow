
import React, { useState, useMemo } from 'react';
import DefaultPageLayout from '@/components/messages/ui/DefaultPageLayout';
import { ChatSidebar } from '@/components/messages/ChatSidebar';
import { ChatView } from '@/components/messages/ChatView';
import { useThreads } from '@/hooks/use-threads';

const MessagesPage: React.FC = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { data: threadsData } = useThreads();

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };
  
  const selectedThreadData = useMemo(() => {
    if (!selectedThreadId || !threadsData) return null;
    const allThreads = [...(threadsData.directMessages || []), ...(threadsData.caseChannels || [])];
    return allThreads.find(t => t.id === selectedThreadId);
  }, [selectedThreadId, threadsData]);

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full items-start">
        <ChatSidebar
          selectedThreadId={selectedThreadId}
          onSelectThread={handleSelectThread}
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
