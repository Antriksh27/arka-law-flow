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
import { ContactSelector } from '@/components/contacts/ContactSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';

interface EditNoteDialogProps {
  note: any;
  open: boolean;
  onClose: () => void;
}

interface NoteFormData {
  title: string;
  content?: string;
  link_type?: 'case' | 'client' | 'contact' | 'none';
  case_id?: string;
  client_id?: string;
  contact_id?: string;
  visibility: 'private' | 'team';
  color: 'yellow' | 'blue' | 'green' | 'red' | 'gray';
  tags: string[];
}

export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({
  note,
  open,
  onClose
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');

  // Determine initial link type
  const getInitialLinkType = () => {
    if (note?.case_id) return 'case';
    if (note?.client_id) return 'client';
    if (note?.contact_id) return 'contact';
    return 'none';
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NoteFormData>({
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      link_type: getInitialLinkType(),
      case_id: note?.case_id || '',
      client_id: note?.client_id || '',
      contact_id: note?.contact_id || '',
      visibility: note?.visibility || 'private',
      color: note?.color || 'gray',
      tags: note?.tags || []
    }
  });

  const watchedTags = watch('tags') || [];
  const linkType = watch('link_type');

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      reset({
        title: note.title,
        content: note.content,
        link_type: getInitialLinkType(),
        case_id: note.case_id || '',
        client_id: note.client_id || '',
        contact_id: note.contact_id || '',
        visibility: note.visibility,
        color: note.color,
        tags: note.tags || []
      });
    }
  }, [note, reset]);

  // Fetch clients for linking
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-notes'],
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

  const updateNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const noteData: any = {
        title: data.title,
        content: data.content || null,
        case_id: data.link_type === 'case' ? data.case_id || null : null,
        client_id: data.link_type === 'client' ? data.client_id || null : null,
        contact_id: data.link_type === 'contact' ? data.contact_id || null : null,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags
      };
      
      const { error } = await (supabase as any)
        .from('notes_v2')
        .update(noteData)
        .eq('id', note.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['contact-notes'] });
      queryClient.invalidateQueries({ queryKey: ['client-notes'] });
      queryClient.invalidateQueries({ queryKey: ['case-notes'] });
      toast({ title: "Note updated successfully" });
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

  const colorOptions = [
    { value: 'gray', label: 'Gray', class: 'bg-gray-100' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-100' },
    { value: 'green', label: 'Green', class: 'bg-green-100' },
    { value: 'red', label: 'Red', class: 'bg-red-100' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">Edit Note</DialogTitle>
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
            <Label htmlFor="link_type" className="text-sm font-medium text-gray-700">
              Link To
            </Label>
            <Select 
              onValueChange={(value) => setValue('link_type', value as any)}
              value={linkType}
            >
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select link type..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="none">No Link</SelectItem>
                <SelectItem value="case">Link to Case</SelectItem>
                <SelectItem value="client">Link to Client</SelectItem>
                <SelectItem value="contact">Link to Contact</SelectItem>
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
              <Select 
                onValueChange={(value) => setValue('client_id', value)} 
                value={watch('client_id')}
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
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
              className="px-6 py-2 border-gray-300 bg-red-600 hover:bg-red-500 text-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-white bg-slate-800 hover:bg-slate-700"
            >
              {isSubmitting ? 'Updating...' : 'Update Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
