import React, { useState } from 'react';
import { CometChatMessageList, CometChatMessageComposer } from '@cometchat/chat-uikit-react';
import { useCaseGroupChat } from '@/hooks/useCaseGroupChat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Settings } from 'lucide-react';
import { ManageParticipantsDialog } from './ManageParticipantsDialog';

interface CaseGroupChatProps {
  caseId: string;
  caseName: string;
}

export const CaseGroupChat: React.FC<CaseGroupChatProps> = ({ caseId, caseName }) => {
  const { group, members, isLoading, error, isReady } = useCaseGroupChat({
    caseId,
    caseName
  });
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);

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
          {error.message || 'Unable to create or load the case chat. Please try again.'}
        </p>
      </div>
    );
  }

  if (!isReady || !group) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <Card className="mb-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{group.getName()}</h3>
              <p className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? 'participant' : 'participants'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowParticipantsDialog(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Participants
          </Button>
        </div>
      </Card>

      {/* CometChat Messages UI */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-border bg-background min-h-0">
        <div className="flex-1 overflow-auto">
          <CometChatMessageList group={group} />
        </div>
        <div className="border-t border-border">
          <CometChatMessageComposer group={group} />
        </div>
      </div>

      {/* Manage Participants Dialog */}
      <ManageParticipantsDialog
        open={showParticipantsDialog}
        onClose={() => setShowParticipantsDialog(false)}
        caseId={caseId}
        groupGuid={`case_${caseId}`}
      />
    </div>
  );
};
