import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CaseNotes } from '../../CaseNotes';

interface NotesTabProps {
  caseId: string;
  onAddNote?: () => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ caseId, onAddNote }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Case Notes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Keep notes and annotations for this case
              </p>
            </div>
            {onAddNote && (
              <Button onClick={onAddNote}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CaseNotes caseId={caseId} />
        </CardContent>
      </Card>
    </div>
  );
};