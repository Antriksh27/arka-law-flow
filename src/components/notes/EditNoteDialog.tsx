import React, { useState, useEffect } from 'react';
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
interface EditNoteDialogProps {
  note: any;
  open: boolean;
  onClose: () => void;
}
interface NoteFormData {
  title: string;
  content?: string;
  case_id?: string;
  visibility: 'private' | 'team';
  color: 'yellow' | 'blue' | 'green' | 'red' | 'gray';
  tags: string[];
}
export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({
  note,
  open,
  onClose
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<NoteFormData>({
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      case_id: note?.case_id || 'no-case',
      visibility: note?.visibility || 'private',
      color: note?.color || 'gray',
      tags: note?.tags || []
    }
  });
  const watchedTags = watch('tags') || [];

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      reset({
        title: note.title,
        content: note.content,
        case_id: note.case_id || 'no-case',
        visibility: note.visibility,
        color: note.color,
        tags: note.tags || []
      });
    }
  }, [note, reset]);

  // Fetch cases for linking
  const {
    data: cases = []
  } = useQuery({
    queryKey: ['cases-for-notes'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('id, case_title').eq('status', 'pending').order('case_title');
      if (error) throw error;
      return data || [];
    }
  });
  const updateNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const noteData = {
        title: data.title,
        content: data.content || null,
        case_id: data.case_id === 'no-case' ? null : data.case_id,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags
      };
      const {
        error
      } = await supabase.from('notes_v2').update(noteData).eq('id', note.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notes']
      });
      toast({
        title: "Note updated successfully"
      });
      onClose();
    },
    onError: error => {
      console.error('Note update error:', error);
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive"
      });
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
    updateNoteMutation.mutate(data);
  };
  const colorOptions = [{
    value: 'gray',
    label: 'Gray',
    class: 'bg-gray-100'
  }, {
    value: 'yellow',
    label: 'Yellow',
    class: 'bg-yellow-100'
  }, {
    value: 'blue',
    label: 'Blue',
    class: 'bg-blue-100'
  }, {
    value: 'green',
    label: 'Green',
    class: 'bg-green-100'
  }, {
    value: 'red',
    label: 'Red',
    class: 'bg-red-100'
  }];
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">Edit Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title *
            </Label>
            <Input id="title" {...register('title', {
            required: 'Title is required'
          })} placeholder="Enter note title..." className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Content
            </Label>
            <Textarea id="content" {...register('content')} placeholder="Write your note content..." className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]" rows={6} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-sm font-medium text-gray-700">
                Visibility
              </Label>
              <Select onValueChange={value => setValue('visibility', value as any)} value={watch('visibility')}>
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
              <Select onValueChange={value => setValue('color', value as any)} value={watch('color')}>
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {colorOptions.map(option => <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${option.class}`} />
                        {option.label}
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
              Link to Case (Optional)
            </Label>
            <Select onValueChange={value => setValue('case_id', value)} value={watch('case_id')}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                <SelectItem value="no-case">No case</SelectItem>
                {cases.map(caseItem => <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.case_title}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tags</Label>
            <div className="flex gap-2">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add a tag..." onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {watchedTags.length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                {watchedTags.map((tag, index) => <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                    {tag}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>)}
              </div>}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="px-6 py-2 border-gray-300 bg-red-600 hover:bg-red-500 text-slate-50">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6 py-2 text-white bg-slate-800 hover:bg-slate-700">
              {isSubmitting ? 'Updating...' : 'Update Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};