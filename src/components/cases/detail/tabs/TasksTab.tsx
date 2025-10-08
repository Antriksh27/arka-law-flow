import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CaseTasks } from '../../CaseTasks';

interface TasksTabProps {
  caseId: string;
  onCreateTask?: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ caseId, onCreateTask }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Case Tasks</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage tasks and action items for this case
              </p>
            </div>
            {onCreateTask && (
              <Button onClick={onCreateTask}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CaseTasks caseId={caseId} />
        </CardContent>
      </Card>
    </div>
  );
};