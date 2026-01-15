import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClientSelector } from './ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { ContactSelector } from '@/components/contacts/ContactSelector';

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'completed';
  due_date?: string;
  reminder_time?: string;
  tags?: string;
  link_type?: 'case' | 'client' | 'contact' | 'none';
  case_id?: string;
  client_id?: string;
  contact_id?: string;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  open,
  onClose,
  taskId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { firmId } = useAuth();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>();

  const linkType = watch('link_type');

  // Fetch current task data
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name),
          case:cases!tasks_case_id_fkey(case_title),
          client:clients!tasks_client_id_fkey(full_name)
        `)
        .eq('id', taskId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!taskId
  });

  // Populate form when task data is loaded
  useEffect(() => {
    if (taskData) {
      setValue('title', taskData.title);
      setValue('description', taskData.description || '');
      setValue('assigned_to', taskData.assigned_to || 'unassigned');
      setValue('priority', taskData.priority);
      setValue('status', taskData.status);
      setValue('due_date', taskData.due_date || '');
      setValue('reminder_time', (taskData as any).reminder_time ? (taskData as any).reminder_time.slice(0, 16) : '');
      setValue('tags', taskData.tags?.join(', ') || '');
      
      if (taskData.case_id) {
        setValue('link_type', 'case');
        setValue('case_id', taskData.case_id);
      } else if (taskData.client_id) {
        setValue('link_type', 'client');
        setValue('client_id', taskData.client_id);
      } else if ((taskData as any).contact_id) {
        setValue('link_type', 'contact');
        setValue('contact_id', (taskData as any).contact_id);
      } else {
        setValue('link_type', 'none');
      }
    }
  }, [taskData, setValue]);

  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-for-tasks', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id, full_name, role')
        .eq('firm_id', firmId);
      
      if (error) throw error;
      
      // Map to expected shape and sort to always show "chitrajeet upadhyaya" first
      const mapped = (data || []).map(tm => ({
        id: tm.user_id,
        full_name: tm.full_name,
        role: tm.role,
      }));
      
      return mapped.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!firmId
  });

  // Fetch cases for linking
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .eq('status', 'pending')
        .order('case_title');
      if (error) throw error;
      return data || [];
    },
    enabled: linkType === 'case'
  });

  // Fetch clients for linking
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: linkType === 'client'
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const updateData: any = {
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to === 'unassigned' ? null : data.assigned_to || null,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : null,
        reminder_time: data.reminder_time ? new Date(data.reminder_time).toISOString() : null,
        case_id: data.link_type === 'case' ? data.case_id || null : null,
        client_id: data.link_type === 'client' ? data.client_id || null : null,
        contact_id: data.link_type === 'contact' ? data.contact_id || null : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString()
      };

      console.log('Updating task with data:', updateData);
      const { error } = await (supabase as any)
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['client-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['contact-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast({ title: "Task updated successfully" });
      onClose();
    },
    onError: (error) => {
      console.error('Task update error:', error);
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: TaskFormData) => {
    updateTaskMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            Loading task details...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Task Title *
            </Label>
            <Input
              id="title"
              {...register('title', { required: 'Task title is required' })}
              placeholder="Enter task title..."
              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter task description..."
              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_type" className="text-sm font-medium text-gray-700">
              Link To
            </Label>
            <Select 
              onValueChange={(value) => setValue('link_type', value as any)}
              value={linkType}
            >
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="none" className="hover:bg-gray-50">No Link</SelectItem>
                <SelectItem value="case" className="hover:bg-gray-50">Link to Case</SelectItem>
                <SelectItem value="client" className="hover:bg-gray-50">Link to Client</SelectItem>
                <SelectItem value="contact" className="hover:bg-gray-50">Link to Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {linkType === 'case' && (
            <div className="space-y-2">
              <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
                Select Case
              </Label>
              <CaseSelector
                value={watch('case_id') || ''}
                onValueChange={(value) => setValue('case_id', value)}
                placeholder="Search and select a case..."
              />
            </div>
          )}

          {linkType === 'client' && (
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-sm font-medium text-gray-700">
                Select Client
              </Label>
              <ClientSelector
                clients={clients}
                value={watch('client_id')}
                onValueChange={(value) => setValue('client_id', value)}
                placeholder="Search and select a client..."
              />
            </div>
          )}

          {linkType === 'contact' && (
            <div className="space-y-2">
              <Label htmlFor="contact_id" className="text-sm font-medium text-gray-700">
                Select Contact
              </Label>
              <ContactSelector
                value={watch('contact_id') || ''}
                onValueChange={(value) => setValue('contact_id', value)}
                placeholder="Search and select a contact..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                Priority
              </Label>
              <Select onValueChange={(value) => setValue('priority', value as any)} value={watch('priority')}>
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="low" className="hover:bg-gray-50">Low</SelectItem>
                  <SelectItem value="medium" className="hover:bg-gray-50">Medium</SelectItem>
                  <SelectItem value="high" className="hover:bg-gray-50">High</SelectItem>
                  <SelectItem value="critical" className="hover:bg-gray-50">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <Select onValueChange={(value) => setValue('status', value as any)} value={watch('status')}>
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="todo" className="hover:bg-gray-50">To Do</SelectItem>
                  <SelectItem value="in_progress" className="hover:bg-gray-50">In Progress</SelectItem>
                  <SelectItem value="completed" className="hover:bg-gray-50">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-sm font-medium text-gray-700">
              Assign To
            </Label>
            <Select onValueChange={(value) => setValue('assigned_to', value)} value={watch('assigned_to')}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="unassigned" className="hover:bg-gray-50">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id} className="hover:bg-gray-50">
                    {member.full_name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
                Due Date
              </Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_time" className="text-sm font-medium text-gray-700">
                Reminder
              </Label>
              <Input
                id="reminder_time"
                type="datetime-local"
                {...register('reminder_time')}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
              Tags
            </Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="Enter tags separated by commas..."
              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> View attachments, comments, and timeline in the task details dialog.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 border-gray-300 bg-red-700 hover:bg-red-600 text-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-white bg-slate-800 hover:bg-slate-700"
            >
              {isSubmitting ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};