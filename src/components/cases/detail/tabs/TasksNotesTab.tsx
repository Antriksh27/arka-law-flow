import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, StickyNote } from 'lucide-react';
import { CaseTasks } from '../../CaseTasks';
import { CaseNotes } from '../../CaseNotes';

interface TasksNotesTabProps {
  caseId: string;
  onCreateTask?: () => void;
  onAddNote?: () => void;
}

export const TasksNotesTab: React.FC<TasksNotesTabProps> = ({ caseId, onCreateTask, onAddNote }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Case Tasks</CardTitle>
                {onCreateTask && (
                  <button
                    onClick={onCreateTask}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Create Task
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Manage tasks and action items for this case
              </p>
            </CardHeader>
            <CardContent>
              <CaseTasks caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Case Notes</CardTitle>
                {onAddNote && (
                  <button
                    onClick={onAddNote}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Note
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Keep notes and annotations for this case
              </p>
            </CardHeader>
            <CardContent>
              <CaseNotes caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
