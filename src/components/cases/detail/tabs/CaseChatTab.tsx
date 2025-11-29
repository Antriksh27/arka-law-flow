import React from 'react';
import { ChatView } from '@/components/messages/ChatView';
import { useCaseChat } from '@/hooks/useCaseChat';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface CaseChatTabProps {
  caseId: string;
}

export const CaseChatTab: React.FC<CaseChatTabProps> = ({ caseId }) => {
  const { data, isLoading, error } = useCaseChat(caseId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-3/4" />
        <Skeleton className="h-32 w-3/4 ml-auto" />
        <Skeleton className="h-32 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load chat</h3>
        <p className="text-muted-foreground">
          Unable to create or load the case chat. Please try again.
        </p>
      </div>
    );
  }

  if (!data?.threadId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No chat available</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-300px)] min-h-[500px]">
      <ChatView threadId={data.threadId} threadData={data.threadData} />
    </div>
  );
};
