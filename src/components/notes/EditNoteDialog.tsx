import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus, Type, FileText, Link2, Eye, Palette, Tag } from 'lucide-react';
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

const colorOptions = [
  { value: 'gray', label: 'Gray', bg: 'bg-white', ring: 'ring-slate-300' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-amber-100', ring: 'ring-amber-400' },
  { value: 'blue', label: 'Blue', bg: 'bg-sky-100', ring: 'ring-sky-400' },
  { value: 'green', label: 'Green', bg: 'bg-emerald-100', ring: 'ring-emerald-400' },
  { value: 'red', label: 'Red', bg: 'bg-rose-100', ring: 'ring-rose-400' },
];

const visibilityOptions = [
  { value: 'private', label: 'Private', bg: 'bg-slate-100', activeBg: 'bg-slate-200', text: 'text-slate-700', icon: '🔒' },
  { value: 'team', label: 'Team', bg: 'bg-violet-50', activeBg: 'bg-violet-100', text: 'text-violet-700', icon: '👥' },
];

export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({
  note,
  open,
  onClose
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');

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
  const watchedVisibility = watch('visibility');
  const watchedColor = watch('color');

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Edit Note</h2>
                <p className="text-sm text-slate-500 mt-0.5">Update your note details</p>
              </div>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-4">
              {/* Title Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Type className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Title</Label>
                      <p className="text-xs text-slate-500">Give your note a title</p>
                    </div>
                  </div>
                  <Input
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter note title..."
                    className="bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
                </div>
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Content</Label>
                      <p className="text-xs text-slate-500">Write your note content</p>
                    </div>
                  </div>
                  <Textarea
                    {...register('content')}
                    placeholder="Write your note here..."
                    className="bg-slate-50 border-slate-200 rounded-xl min-h-[120px]"
                  />
                </div>
              </div>

              {/* Color & Visibility Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 space-y-4">
                  {/* Color Selection */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-slate-900">Color</Label>
                        <p className="text-xs text-slate-500">Choose a color for your note</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('color', option.value as any)}
                          className={`w-10 h-10 rounded-xl ${option.bg} border-2 transition-all ${
                            watchedColor === option.value
                              ? `ring-2 ${option.ring} ring-offset-2 border-transparent`
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          title={option.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-violet-500" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-slate-900">Visibility</Label>
                        <p className="text-xs text-slate-500">Who can see this note?</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {visibilityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('visibility', option.value as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            watchedVisibility === option.value
                              ? `${option.activeBg} ${option.text} ring-2 ring-offset-1 ring-current`
                              : `${option.bg} ${option.text} hover:opacity-80`
                          }`}
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Link To Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Link To</Label>
                      <p className="text-xs text-slate-500">Connect to a case, client, or contact</p>
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
                      <Select 
                        onValueChange={(value) => setValue('client_id', value)} 
                        value={watch('client_id')}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                          <SelectValue placeholder="Select a client..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 shadow-lg max-h-60 rounded-xl">
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

              {/* Tags Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Tags</Label>
                      <p className="text-xs text-slate-500">Add tags to organize your notes</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                    <Button 
                      type="button" 
                      onClick={addTag} 
                      variant="outline" 
                      size="icon"
                      className="h-11 w-11 rounded-xl border-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {watchedTags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="bg-sky-50 text-sky-700 border-sky-200 rounded-full pl-3 pr-2 py-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-sky-100 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  {isSubmitting ? 'Updating...' : 'Update Note'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
