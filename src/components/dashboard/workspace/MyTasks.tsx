import { CheckCircle2, Circle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import TimeUtils from '@/lib/timeUtils';
interface Task {
  id?: string;
  title: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status?: string;
}
interface MyTasksProps {
  tasks: Task[];
  isLoading?: boolean;
}
export const MyTasks = ({
  tasks,
  isLoading
}: MyTasksProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowDetailDialog(true);
  };
  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowEditDialog(true);
  };
  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskTitle(taskTitle);
    setShowDeleteDialog(true);
  };
  if (isLoading) {
    return <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <h2 className="text-xl font-semibold">My Tasks</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>;
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  return <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            
            <h2 className="text-xl font-semibold">My Tasks</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="bg-slate-900 hover:bg-slate-800">
            + Add Task
          </Button>
        </div>

        {tasks.length === 0 ? <Card className="p-8 text-center border-dashed">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No tasks yet</p>
            <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first task
            </Button>
          </Card> : <div className="grid grid-cols-2 gap-4">
            {tasks.slice(0, 4).map((task, index) => <Card key={task.id || index} className={`p-4 border-2 ${getPriorityColor(task.priority)} relative group cursor-pointer hover:shadow-md transition-shadow`} onClick={() => task.id && handleViewTask(task.id)}>
                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" onClick={e => e.stopPropagation()} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm flex-1">{task.title}</h3>
                      <Badge className={`text-xs px-2 py-0 h-5 ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.due_date && <p className="text-xs text-muted-foreground">
                        Due: {TimeUtils.formatDate(task.due_date, 'MMM d, yyyy')} (IST)
                      </p>}
                  </div>
                </div>
              </Card>)}
          </div>}
      </div>

      <CreateTaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
      
      <TaskDetailDialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} taskId={selectedTaskId} onEdit={handleEditTask} onDelete={taskId => {
      const task = tasks.find(t => t.id === taskId);
      handleDeleteTask(taskId, task?.title || 'Unknown Task');
    }} />
      
      <EditTaskDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} taskId={selectedTaskId} />
      
      <DeleteTaskDialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} taskId={selectedTaskId} taskTitle={selectedTaskTitle} />
    </>;
};