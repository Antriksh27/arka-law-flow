import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { X, Type, FileText, Link2, User, Calendar, Tag, Flag, CheckCircle } from 'lucide-react';
import { bg, border, text } from '@/lib/colors';

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

const priorityOptions = [
  { value: 'low', label: 'Low', bg: 'bg-slate-100', activeBg: 'bg-slate-200', text: 'text-slate-700' },
  { value: 'medium', label: 'Medium', bg: 'bg-amber-50', activeBg: 'bg-amber-100', text: 'text-amber-700' },
  { value: 'high', label: 'High', bg: 'bg-rose-50', activeBg: 'bg-rose-100', text: 'text-rose-700' },
  { value: 'critical', label: 'Critical', bg: 'bg-red-100', activeBg: 'bg-red-200', text: 'text-red-700' },
];

const statusOptions = [
  { value: 'todo', label: 'To Do', bg: 'bg-slate-100', activeBg: 'bg-slate-200', text: 'text-slate-700' },
  { value: 'in_progress', label: 'In Progress', bg: 'bg-sky-50', activeBg: 'bg-sky-100', text: 'text-sky-700' },
  { value: 'completed', label: 'Completed', bg: 'bg-emerald-50', activeBg: 'bg-emerald-100', text: 'text-emerald-700' },
];

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
  const watchedPriority = watch('priority');
  const watchedStatus = watch('status');

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
        <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-muted">
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading task details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className={`flex flex-col h-full ${bg.page}`}>
          {/* Header */}
          <div className={`px-6 py-5 ${bg.card} border-b ${border.light}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${text.primary}`}>Edit Task</h2>
                <p className={`text-sm ${text.light} mt-0.5`}>Update task details and settings</p>
              </div>
              <button
                onClick={onClose}
                className={`md:hidden w-8 h-8 rounded-full ${bg.muted} flex items-center justify-center hover:bg-muted transition-colors`}
              >
                <X className={`w-4 h-4 ${text.light}`} />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-4">
              {/* Title Card */}
              <div className={`${bg.card} rounded-2xl shadow-sm overflow-hidden`}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Type className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label className={`text-sm font-semibold ${text.primary}`}>Task Title</Label>
                      <p className={`text-xs ${text.light}`}>What needs to be done?</p>
                    </div>
                  </div>
                  <Input
                    {...register('title', { required: 'Task title is required' })}
                    placeholder="Enter task title..."
                    className={`${bg.input} ${border.default} rounded-xl h-11`}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Description</Label>
                      <p className="text-xs text-slate-500">Additional details about the task</p>
                    </div>
                  </div>
                  <Textarea
                    {...register('description')}
                    placeholder="Add task description..."
                    className="bg-slate-50 border-slate-200 rounded-xl min-h-[100px]"
                  />
                </div>
              </div>

              {/* Assign To Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Assign To</Label>
                      <p className="text-xs text-slate-500">Who should handle this task?</p>
                    </div>
                  </div>
                  <Select onValueChange={(value) => setValue('assigned_to', value)} value={watch('assigned_to')}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Link To Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Link To</Label>
                      <p className="text-xs text-slate-500">Connect this task to a case, client, or contact</p>
                    </div>
                  </div>
                  <Select 
                    onValueChange={(value) => setValue('link_type', value as any)}
                    value={linkType}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                      <SelectValue placeholder="Select link type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                      <SelectItem value="none">No Link</SelectItem>
                      <SelectItem value="case">Link to Case</SelectItem>
                      <SelectItem value="client">Link to Client</SelectItem>
                      <SelectItem value="contact">Link to Contact</SelectItem>
                    </SelectContent>
                  </Select>

                  {linkType === 'case' && (
                    <div className="mt-3">
                      <CaseSelector
                        value={watch('case_id') || ''}
                        onValueChange={(value) => setValue('case_id', value)}
                        placeholder="Search and select a case..."
                      />
                    </div>
                  )}

                  {linkType === 'client' && (
                    <div className="mt-3">
                      <ClientSelector
                        clients={clients}
                        value={watch('client_id')}
                        onValueChange={(value) => setValue('client_id', value)}
                        placeholder="Search and select a client..."
                      />
                    </div>
                  )}

                  {linkType === 'contact' && (
                    <div className="mt-3">
                      <ContactSelector
                        value={watch('contact_id') || ''}
                        onValueChange={(value) => setValue('contact_id', value)}
                        placeholder="Search and select a contact..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Priority & Status Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 space-y-4">
                  {/* Priority */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Flag className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-slate-900">Priority</Label>
                        <p className="text-xs text-slate-500">How urgent is this task?</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('priority', option.value as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            watchedPriority === option.value
                              ? `${option.activeBg} ${option.text} ring-2 ring-offset-1 ring-current`
                              : `${option.bg} ${option.text} hover:opacity-80`
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-slate-900">Status</Label>
                        <p className="text-xs text-slate-500">Current progress of the task</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('status', option.value as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            watchedStatus === option.value
                              ? `${option.activeBg} ${option.text} ring-2 ring-offset-1 ring-current`
                              : `${option.bg} ${option.text} hover:opacity-80`
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Schedule</Label>
                      <p className="text-xs text-slate-500">Due date and reminder settings</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Due Date</Label>
                      <Input
                        type="date"
                        {...register('due_date')}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Reminder</Label>
                      <Input
                        type="datetime-local"
                        {...register('reminder_time')}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Tags</Label>
                      <p className="text-xs text-slate-500">Separate multiple tags with commas</p>
                    </div>
                  </div>
                  <Input
                    {...register('tags')}
                    placeholder="e.g., urgent, follow-up, client-review"
                    className="bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 sticky bottom-0">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-full px-6 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full px-6 bg-slate-800 hover:bg-slate-700 text-white"
                >
                  {isSubmitting ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
