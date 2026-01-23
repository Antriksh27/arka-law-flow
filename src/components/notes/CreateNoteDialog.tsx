
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus, StickyNote, FileText, Eye, Palette, Tag, Link } from 'lucide-react';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';

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
  client_contact_id?: string;
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
      case_id: caseId || '',
      client_contact_id: clientId || ''
    }
  });

  const watchedTags = watch('tags') || [];
  const watchedColor = watch('color');
  const watchedVisibility = watch('visibility');
  const watchedClientContactId = watch('client_contact_id');

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const clientIdToUse = data.client_contact_id || null;

      const noteData: any = {
        id: crypto.randomUUID(),
        title: data.title,
        content: data.content || null,
        case_id: data.case_id === 'none' ? null : data.case_id || null,
        client_id: clientIdToUse,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags,
        created_at: new Date().toISOString(),
        created_by: user.data.user.id,
      };

      const { data: createdNote, error } = await supabase
        .from('notes_v2')
        .insert(noteData)
        .select()
        .single();
      
      if (error) throw error;
      return createdNote;
    },
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      const previousNotes = queryClient.getQueryData(['notes']);
      
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
    { value: 'gray', label: 'Gray', bg: 'bg-slate-100', activeBg: 'bg-slate-200' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-amber-100', activeBg: 'bg-amber-200' },
    { value: 'blue', label: 'Blue', bg: 'bg-sky-100', activeBg: 'bg-sky-200' },
    { value: 'green', label: 'Green', bg: 'bg-emerald-100', activeBg: 'bg-emerald-200' },
    { value: 'red', label: 'Red', bg: 'bg-rose-100', activeBg: 'bg-rose-200' },
  ];

  const visibilityOptions = [
    { value: 'private', label: '🔒 Private', bg: 'bg-slate-100', activeBg: 'bg-slate-200', text: 'text-slate-700' },
    { value: 'team', label: '👥 Team', bg: 'bg-violet-50', activeBg: 'bg-violet-100', text: 'text-violet-700' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create New Note</h2>
                <p className="text-sm text-muted-foreground mt-1">Capture your thoughts quickly</p>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
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
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <StickyNote className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">Give your note a name</p>
                    </div>
                  </div>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter note title..."
                    className="bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                  {errors.title && <p className="text-sm text-destructive mt-2">{errors.title.message}</p>}
                </div>
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <Label htmlFor="content" className="text-sm font-semibold text-foreground">Content</Label>
                      <p className="text-xs text-muted-foreground">Write your note content</p>
                    </div>
                  </div>
                  <Textarea
                    id="content"
                    {...register('content')}
                    placeholder="Write your note content..."
                    className="bg-slate-50 border-slate-200 rounded-xl min-h-[120px] resize-none"
                    rows={6}
                  />
                </div>
              </div>

              {/* Color & Visibility Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="space-y-4">
                  {/* Color */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Color</Label>
                    </div>
                    <div className="flex gap-3">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('color', option.value as any)}
                          className={`w-10 h-10 rounded-xl transition-all ${
                            watchedColor === option.value
                              ? `${option.activeBg} ring-2 ring-offset-2 ring-slate-400`
                              : `${option.bg} hover:opacity-80`
                          }`}
                          title={option.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visibility</Label>
                    </div>
                    <div className="flex gap-2">
                      {visibilityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('visibility', option.value as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            watchedVisibility === option.value
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

              {/* Link To Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <Link className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Link To (Optional)</Label>
                      <p className="text-xs text-muted-foreground">Connect to case or client</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Case</Label>
                    <CaseSelector
                      value={watch('case_id') || ''}
                      onValueChange={(value) => setValue('case_id', value)}
                      placeholder="Select a case..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client/Contact</Label>
                    <ClientSelector
                      value={watchedClientContactId || ''}
                      onValueChange={(value) => setValue('client_contact_id', value)}
                      placeholder="Select client..."
                    />
                  </div>
                </div>
              </div>

              {/* Tags Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Tags</Label>
                      <p className="text-xs text-muted-foreground">Organize with tags</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11 flex-1"
                    />
                    <Button type="button" onClick={addTag} variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {watchedTags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 rounded-full px-3 py-1">
                          {tag}
                          <X 
                            className="w-3 h-3 ml-1.5 cursor-pointer" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
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
                {isSubmitting ? 'Creating...' : 'Create Note'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
