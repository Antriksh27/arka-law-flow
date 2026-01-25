
import React, { useEffect, useState, useRef } from 'react';
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
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { Mic, MicOff, Loader2, CheckSquare, FileText, Calendar, User, Tag, Bell, Link, X } from 'lucide-react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { useDeepgramTranscription } from '@/hooks/useDeepgramTranscription';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  clientId?: string;
  contactId?: string;
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
  link_type?: 'case' | 'client_contact' | 'none';
  case_id?: string;
  client_contact_id?: string;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  caseId,
  clientId,
  contactId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { firmId } = useAuth();
  
  const [isDictating, setIsDictating] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const { transcribe, isProcessing: isTranscribing } = useDeepgramTranscription();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    defaultValues: {
      priority: 'medium',
      status: 'todo',
      link_type: caseId ? 'case' : (clientId ? 'client_contact' : 'none'),
      case_id: caseId || '',
      client_contact_id: clientId || ''
    }
  });

  useEffect(() => {
    if (clientId) {
      setValue('client_contact_id', clientId);
    }
  }, [clientId, setValue]);

  const linkType = watch('link_type');
  const watchedPriority = watch('priority');
  const watchedStatus = watch('status');

  const toggleDictation = async () => {
    if (isDictating) {
      setIsDictating(false);
      
      try {
        const blob = await audioRecorderRef.current.stopRecording();
        
        toast({
          title: "Transcribing...",
          description: "Converting speech to text"
        });

        const result = await transcribe(blob);
        
        if (result.error) {
          toast({
            title: "Transcription failed",
            description: result.error,
            variant: "destructive"
          });
        } else if (result.text) {
          const currentDescription = watch('description') || '';
          const newDescription = currentDescription 
            ? `${currentDescription}\n\n${result.text}` 
            : result.text;
          setValue('description', newDescription);
          
          toast({
            title: "Transcription complete",
            description: "Speech converted to text successfully"
          });
        }
      } catch (error) {
        console.error('Dictation error:', error);
        toast({
          title: "Dictation failed",
          description: "Could not process speech",
          variant: "destructive"
        });
      }
    } else {
      try {
        await audioRecorderRef.current.startRecording();
        setIsDictating(true);
        
        toast({
          title: "Recording started",
          description: "Speak now, click again to finish"
        });
      } catch (error) {
        toast({
          title: "Dictation failed",
          description: "Could not access microphone",
          variant: "destructive"
        });
      }
    }
  };

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

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      let clientIdToUse = null;
      if (data.link_type === 'client_contact' && data.client_contact_id) {
        const { data: clientCheck } = await supabase
          .from('clients')
          .select('id')
          .eq('id', data.client_contact_id)
          .maybeSingle();
        
        if (clientCheck) {
          clientIdToUse = data.client_contact_id;
        }
      }

      const taskData: any = {
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to || null,
        assigned_by: user.data.user.id,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : null,
        reminder_time: data.reminder_time ? new Date(data.reminder_time).toISOString() : null,
        case_id: data.link_type === 'case' ? data.case_id || null : null,
        client_id: clientIdToUse || null,
        contact_id: contactId || null,
        created_by: user.data.user.id,
        firm_id: firmId,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      console.log('Creating task with data:', taskData);
      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();
      
      if (error) throw error;
      return createdTask;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return [{ ...newTask, id: 'temp-' + Date.now() }];
        return [{ ...newTask, id: 'temp-' + Date.now(), created_at: new Date().toISOString() }, ...old];
      });
      
      await queryClient.cancelQueries({ queryKey: ['dashboard-data'] });
      const previousDashboard = queryClient.getQueryData(['dashboard-data']);
      
      return { previousTasks, previousDashboard };
    },
    onError: (error, _variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard-data'], context.previousDashboard);
      }
      console.error('Task creation error:', error);
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({ title: "Task created successfully" });
      reset();
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data-optimized'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] });
      }
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: ['contact-tasks', contactId] });
      }
    }
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', bg: 'bg-slate-100', activeBg: 'bg-slate-200', text: 'text-slate-700' },
    { value: 'medium', label: 'Medium', bg: 'bg-amber-50', activeBg: 'bg-amber-100', text: 'text-amber-700' },
    { value: 'high', label: 'High', bg: 'bg-rose-50', activeBg: 'bg-rose-100', text: 'text-rose-700' },
    { value: 'critical', label: 'Critical', bg: 'bg-red-100', activeBg: 'bg-red-200', text: 'text-red-700' },
  ];

  const statusOptions = [
    { value: 'todo', label: 'To Do', bg: 'bg-slate-100', activeBg: 'bg-slate-200', text: 'text-slate-700' },
    { value: 'in_progress', label: 'In Progress', bg: 'bg-sky-50', activeBg: 'bg-sky-100', text: 'text-sky-700' },
    { value: 'completed', label: 'Done', bg: 'bg-emerald-50', activeBg: 'bg-emerald-100', text: 'text-emerald-700' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create New Task</h2>
                <p className="text-sm text-muted-foreground mt-1">Add a new task to your workflow</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Title Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                        Task Title <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">What needs to be done?</p>
                    </div>
                  </div>
                  <Input
                    id="title"
                    {...register('title', { required: 'Task title is required' })}
                    placeholder="Enter task title..."
                    className="bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                  {errors.title && <p className="text-sm text-destructive mt-2">{errors.title.message}</p>}
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
                        <p className="text-xs text-muted-foreground">Add more details</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleDictation}
                      disabled={isTranscribing}
                      className={`rounded-full ${isDictating 
                        ? 'bg-rose-50 text-rose-600 border-rose-200' 
                        : 'bg-slate-50 border-slate-200'}`}
                    >
                      {isTranscribing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing</>
                      ) : isDictating ? (
                        <><MicOff className="w-4 h-4 mr-2" />Stop</>
                      ) : (
                        <><Mic className="w-4 h-4 mr-2" />Dictate</>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Enter task description or click Dictate to speak..."
                      className="bg-slate-50 border-slate-200 rounded-xl min-h-[100px] resize-none"
                      rows={4}
                    />
                    {isDictating && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-rose-500 text-sm">
                        <span className="animate-pulse">●</span> Recording...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Priority & Status Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="space-y-4">
                  {/* Priority */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Priority</Label>
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
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Status</Label>
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

              {/* Assignee Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Assign To</Label>
                      <p className="text-xs text-muted-foreground">Who will work on this?</p>
                    </div>
                  </div>
                  <Select onValueChange={(value) => setValue('assigned_to', value)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-xl">
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
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <Link className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Link To</Label>
                      <p className="text-xs text-muted-foreground">Connect to case or client</p>
                    </div>
                  </div>
                  <Select 
                    onValueChange={(value) => setValue('link_type', value as any)} 
                    defaultValue={caseId ? 'case' : (clientId ? 'client_contact' : 'none')}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                      <SelectItem value="none">No Link</SelectItem>
                      <SelectItem value="case">Link to Case</SelectItem>
                      <SelectItem value="client_contact">Link to Client/Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {linkType === 'case' && (
                  <div className="p-4 bg-slate-50/50">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Select Case</Label>
                    <CaseSelector
                      value={watch('case_id') || ''}
                      onValueChange={(value) => setValue('case_id', value)}
                      placeholder="Search and select a case..."
                    />
                  </div>
                )}

                {linkType === 'client_contact' && (
                  <div className="p-4 bg-slate-50/50">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Select Client or Contact</Label>
                    <ClientSelector
                      value={watch('client_contact_id') || ''}
                      onValueChange={(value) => setValue('client_contact_id', value)}
                      placeholder="Search and select..."
                    />
                  </div>
                )}
              </div>

              {/* Due Date & Reminder Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Schedule</Label>
                      <p className="text-xs text-muted-foreground">Set due date and reminder</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</Label>
                    <Input
                      type="date"
                      {...register('due_date')}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reminder</Label>
                    <Input
                      type="datetime-local"
                      {...register('reminder_time')}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Tags Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Tags</Label>
                      <p className="text-xs text-muted-foreground">Separate with commas</p>
                    </div>
                  </div>
                  <Input
                    {...register('tags')}
                    placeholder="urgent, follow-up, client-work..."
                    className="bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white">
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="min-w-[100px] rounded-full border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="min-w-[140px] bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
