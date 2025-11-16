
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus } from 'lucide-react';

interface CreateNoteDialogProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  clientId?: string;
}

interface NoteFormData {
  title: string;
  content?: string;
  case_id?: string;
  visibility: 'private' | 'team';
  color: 'yellow' | 'blue' | 'green' | 'red' | 'gray';
  tags: string[];
}

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({
  open,
  onClose,
  caseId,
  clientId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NoteFormData>({
    defaultValues: {
      visibility: 'private',
      color: 'gray',
      tags: [],
      case_id: caseId || ''
    }
  });

  const watchedTags = watch('tags') || [];
  const watchedColor = watch('color');
  const watchedVisibility = watch('visibility');

  // Fetch cases for linking
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .eq('status', 'pending')
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const noteData: any = {
        id: crypto.randomUUID(), // Generate temporary ID for optimistic update
        title: data.title,
        content: data.content || null,
        case_id: data.case_id === 'none' ? null : data.case_id || null,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags,
        created_at: new Date().toISOString(),
        created_by: user.data.user.id,
      };

      // Attach client_id if provided
      if (clientId) {
        noteData.client_id = clientId;
      }

      const { data: createdNote, error } = await supabase
        .from('notes_v2')
        .insert(noteData)
        .select()
        .single();
      
      if (error) throw error;
      return createdNote;
    },
    onMutate: async (newNote) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(['notes']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['notes'], (old: any) => {
        if (!old) return [{ ...newNote, id: 'temp-' + Date.now() }];
        return [{ ...newNote, id: 'temp-' + Date.now(), created_at: new Date().toISOString() }, ...old];
      });
      
      if (clientId) {
        await queryClient.cancelQueries({ queryKey: ['client-notes-v2', clientId] });
        const previousClientNotes = queryClient.getQueryData(['client-notes-v2', clientId]);
        queryClient.setQueryData(['client-notes-v2', clientId], (old: any) => {
          if (!old) return [{ ...newNote, id: 'temp-' + Date.now() }];
          return [{ ...newNote, id: 'temp-' + Date.now(), created_at: new Date().toISOString() }, ...old];
        });
        return { previousNotes, previousClientNotes };
      }
      
      return { previousNotes };
    },
    onError: (error, _variables, context: any) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
      if (context?.previousClientNotes && clientId) {
        queryClient.setQueryData(['client-notes-v2', clientId], context.previousClientNotes);
      }
      console.error('Note creation error:', error);
      toast({
        title: "Failed to create note",
        description: (error as any).message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({ title: "Note created successfully" });
      reset();
      onClose();
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['client-notes-v2', clientId] });
      }
    }
  });

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  const colorOptions = [
    { value: 'gray', label: 'Gray', class: 'bg-gray-100' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-100' },
    { value: 'green', label: 'Green', class: 'bg-green-100' },
    { value: 'red', label: 'Red', class: 'bg-red-100' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">Create New Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title *
            </Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter note title..."
              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Content
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Write your note content..."
              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-sm font-medium text-gray-700">
                Visibility
              </Label>
              <Select 
                onValueChange={(value) => setValue('visibility', value as any)} 
                defaultValue="private"
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="private">🔒 Private</SelectItem>
                  <SelectItem value="team">👥 Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-sm font-medium text-gray-700">
                Color
              </Label>
              <Select 
                onValueChange={(value) => setValue('color', value as any)} 
                defaultValue="gray"
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {colorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${option.class}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
              Link to Case (Optional)
            </Label>
            <Select onValueChange={(value) => setValue('case_id', value)} defaultValue={caseId || 'none'}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                <SelectItem value="none">No case</SelectItem>
                {cases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.case_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watchedTags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                    {tag}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-white bg-slate-800 hover:bg-slate-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
