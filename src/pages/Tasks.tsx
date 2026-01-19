import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Calendar, User, Tag, Search, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';
import { EditTaskDialog } from '../components/tasks/EditTaskDialog';
import { TaskDetailDialog } from '../components/tasks/TaskDetailDialog';
import { DeleteTaskDialog } from '../components/tasks/DeleteTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTaskCard } from '@/components/tasks/MobileTaskCard';
import { MobileFAB } from '@/components/mobile/MobileFAB';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MobilePageContainer } from '@/components/mobile/MobilePageContainer';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';

const Tasks = () => {
  const isMobile = useIsMobile();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [activeTabMobile, setActiveTabMobile] = useState<'todo' | 'in_progress' | 'completed'>('todo');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', searchTerm, statusFilter, priorityFilter, assigneeFilter],
    queryFn: async () => {
      console.log('Fetching tasks...');
      let query = (supabase as any)
        .from('tasks')
        .select(`
          *,
          case:cases!tasks_case_id_fkey(case_title),
          client:clients!tasks_client_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'todo' | 'in_progress' | 'completed');
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as 'low' | 'medium' | 'high');
      }
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', assigneeFilter);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      console.log('Fetched tasks:', data);
      return data || [];
    }
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return (data || []).map(tm => ({ id: tm.user_id, full_name: tm.full_name }));
    }
  });
  
  const memberMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    (teamMembers || []).forEach((m: any) => {
      if (m.id) map[m.id] = m.full_name;
    });
    return map;
  }, [teamMembers]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: 'todo' | 'in_progress' | 'completed' }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast({ title: "Task updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    completed: tasks.filter(task => task.status === 'completed')
  };

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    updateTaskMutation.mutate({ taskId, status: newStatus });
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowEditDialog(true);
  };

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowDetailDialog(true);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskTitle(taskTitle);
    setShowDeleteDialog(true);
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const TaskCard = ({ task }: { task: any }) => (
    <div className={`bg-gray-50 rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow hover:bg-white ${
      isOverdue(task.due_date, task.status) ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h4 
          className="font-medium text-sm text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
          onClick={() => handleViewTask(task.id)}
        >
          {task.title}
        </h4>
        <div className="flex items-center gap-1">
          <Badge className={`${getPriorityColor(task.priority)} text-xs rounded-full border`}>
            {task.priority}
          </Badge>
          {isOverdue(task.due_date, task.status) && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs rounded-full border">
              Overdue
            </Badge>
          )}
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.case && (
        <div className="text-xs text-blue-600 mb-2">
          Case: {task.case.case_title}
        </div>
      )}

      {task.client && (
        <div className="text-xs text-green-600 mb-2">
          Client: {task.client.full_name}
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate">{(task.assigned_to && memberMap[task.assigned_to]) || 'Unassigned'}</span>
        </div>
        {task.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : ''}`}>
            <Calendar className="w-3 h-3" />
            {TimeUtils.formatDate(task.due_date, 'MMM d')}
            {isOverdue(task.due_date, task.status) && ' (Overdue)'}
          </div>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <Tag className="w-3 h-3 text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-200">
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          {task.status === 'todo' && (
            <button
              onClick={() => handleStatusChange(task.id, 'in_progress')}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Start
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => handleStatusChange(task.id, 'completed')}
              className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              Complete
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewTask(task.id)}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleEditTask(task.id)}
            className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Edit Task"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDeleteTask(task.id, task.title)}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Filter Sheet
  const MobileFilterSheet = () => (
    <Sheet open={showMobileFilter} onOpenChange={setShowMobileFilter}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          {/* Priority Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Priority</h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'high', 'medium', 'low'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`px-4 h-10 rounded-full font-medium text-sm transition-all ${
                    priorityFilter === priority
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-border text-foreground'
                  }`}
                >
                  {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Assignee</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => setAssigneeFilter('all')}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  assigneeFilter === 'all'
                    ? 'bg-slate-100'
                    : 'bg-white border border-border'
                }`}
              >
                All Assignees
              </button>
              <button
                onClick={() => setAssigneeFilter('unassigned')}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  assigneeFilter === 'unassigned'
                    ? 'bg-slate-100'
                    : 'bg-white border border-border'
                }`}
              >
                Unassigned
              </button>
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setAssigneeFilter(member.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    assigneeFilter === member.id
                      ? 'bg-slate-100'
                      : 'bg-white border border-border'
                  }`}
                >
                  {member.full_name}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setShowMobileFilter(false)}
            className="w-full h-12 bg-slate-800 hover:bg-slate-700"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (isLoading) {
    return (
      <MobilePageContainer>
        <div className="text-center py-8">Loading tasks...</div>
      </MobilePageContainer>
    );
  }

  // Get active filters count for mobile
  const activeFiltersCount = (priorityFilter !== 'all' ? 1 : 0) + (assigneeFilter !== 'all' ? 1 : 0);

  return (
    <MobilePageContainer>
      <div className={isMobile ? "" : "max-w-7xl mx-auto p-6 space-y-6"}>
      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all tasks across your cases</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      )}

      {/* Mobile Sticky Header with Search and Tabs */}
      {isMobile && (
        <MobileStickyHeader
          title="Tasks"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search tasks..."
          onFilterClick={() => setShowMobileFilter(true)}
          activeFiltersCount={activeFiltersCount}
          tabs={[
            { value: 'todo', label: `To Do (${tasksByStatus.todo.length})` },
            { value: 'in_progress', label: `In Progress (${tasksByStatus.in_progress.length})` },
            { value: 'completed', label: `Done (${tasksByStatus.completed.length})` },
          ]}
          activeTab={activeTabMobile}
          onTabChange={(value) => setActiveTabMobile(value as 'todo' | 'in_progress' | 'completed')}
        />
      )}

      {/* Desktop Filters */}
      {!isMobile && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-white border-gray-300"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-48 bg-white border-gray-300">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Statistics - Hidden on mobile */}
      {!isMobile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{tasksByStatus.todo.length}</div>
            <div className="text-sm text-gray-600">To Do</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{tasksByStatus.in_progress.length}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{tasksByStatus.completed.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Mobile Tasks Content */}
      {isMobile ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 space-y-3 pb-24">
          {tasksByStatus[activeTabMobile].length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No {activeTabMobile.replace('_', ' ')} tasks</p>
            </div>
          ) : (
            tasksByStatus[activeTabMobile].map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onView={() => handleViewTask(task.id)}
                onEdit={() => handleEditTask(task.id)}
                onDelete={() => handleDeleteTask(task.id, task.title)}
                onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                memberMap={memberMap}
              />
            ))
          )}
        </div>
      ) : (
        /* Desktop Kanban View */
        tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <Card key={status} className="h-fit bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  {status.replace('_', ' ')} ({statusTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {statusTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No {status.replace('_', ' ')} tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        ) : (
        <div className="text-center py-12 text-gray-500">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-gray-400 mb-6">Get started by creating your first task</p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Task
          </Button>
          </div>
        )
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <MobileFAB
          onClick={() => setShowCreateDialog(true)}
          icon={Plus}
        />
      )}


      {/* Mobile Filter Sheet */}
      <MobileFilterSheet />

      <CreateTaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
      
      <EditTaskDialog 
        open={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        taskId={selectedTaskId}
      />
      
      <TaskDetailDialog 
        open={showDetailDialog} 
        onClose={() => setShowDetailDialog(false)}
        taskId={selectedTaskId}
        onEdit={handleEditTask}
        onDelete={(taskId) => {
          // We need to get the task title for the delete dialog
          const task = tasks.find(t => t.id === taskId);
          handleDeleteTask(taskId, task?.title || 'Unknown Task');
        }}
      />
      
      <DeleteTaskDialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        taskId={selectedTaskId}
        taskTitle={selectedTaskTitle}
      />
      </div>
    </MobilePageContainer>
  );
};

export default Tasks;
