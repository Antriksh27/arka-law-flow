import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus, Mic, MicOff, Loader2, FileText, Palette, Link2, Tag } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { MobileDrawingSheet } from './MobileDrawingSheet';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { AudioRecorder } from '@/utils/audioRecorder';
import { useDeepgramTranscription } from '@/hooks/useDeepgramTranscription';
import { useIsMobile } from '@/hooks/use-mobile';

interface CreateNoteMultiModalProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  clientId?: string;
  contactId?: string;
  isPinned?: boolean;
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

export const CreateNoteMultiModal: React.FC<CreateNoteMultiModalProps> = ({
  open,
  onClose,
  caseId,
  clientId,
  contactId,
  isPinned = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [showMobileDrawing, setShowMobileDrawing] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const { transcribe, isProcessing: isTranscribing } = useDeepgramTranscription();

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
      case_id: caseId || 'no-case',
      client_contact_id: clientId || ''
    }
  });

  const watchedTags = watch('tags') || [];
  const watchedClientContactId = watch('client_contact_id');
  const watchedColor = watch('color');
  const watchedVisibility = watch('visibility');

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');
      let finalContent = data.content || '';

      if (drawingData && !finalContent.trim()) {
        finalContent = '[Drawing attached]';
      }

      const clientId = data.client_contact_id || null;

      const noteData = {
        title: data.title,
        content: finalContent || null,
        case_id: data.case_id === 'no-case' ? null : data.case_id,
        client_id: clientId || null,
        contact_id: contactId || null,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags,
        drawing_data: drawingData,
        audio_data: null,
        is_pinned: isPinned,
        created_by: user.data.user.id
      };

      const { error } = await supabase.from('notes_v2').insert(noteData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['case-notes'] });
      queryClient.invalidateQueries({ queryKey: ['client-notes-v2'] });
      queryClient.invalidateQueries({ queryKey: ['contact-notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast({ title: "Note created successfully" });
      handleReset();
      onClose();
    },
    onError: error => {
      console.error('Note creation error:', error);
      toast({
        title: "Failed to create note",
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

  const handleReset = () => {
    reset();
    setDrawingData(null);
    setNewTag('');
    setActiveTab('write');
  };

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  const colorOptions = [
    { value: 'gray', label: 'Gray', class: 'bg-slate-200' },
    { value: 'yellow', label: 'Yellow', class: 'bg-amber-200' },
    { value: 'blue', label: 'Blue', class: 'bg-sky-200' },
    { value: 'green', label: 'Green', class: 'bg-emerald-200' },
    { value: 'red', label: 'Red', class: 'bg-rose-200' }
  ];

  const toggleDictation = async () => {
    if (isDictating) {
      setIsDictating(false);
      try {
        const blob = await audioRecorderRef.current.stopRecording();
        toast({ title: "Transcribing...", description: "Converting speech to text" });
        const result = await transcribe(blob);
        if (result.error) {
          toast({ title: "Transcription failed", description: result.error, variant: "destructive" });
        } else if (result.text) {
          const currentContent = watch('content') || '';
          const newContent = currentContent ? `${currentContent}\n\n${result.text}` : result.text;
          setValue('content', newContent);
          toast({ title: "Transcription complete", description: "Speech converted to text successfully" });
        }
      } catch (error) {
        console.error('Dictation error:', error);
        toast({ title: "Dictation failed", description: "Could not process speech", variant: "destructive" });
      }
    } else {
      try {
        await audioRecorderRef.current.startRecording();
        setIsDictating(true);
        toast({ title: "Recording started", description: "Speak now, click again to finish" });
      } catch (error) {
        toast({ title: "Dictation failed", description: "Could not access microphone", variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create New Note</h2>
                <p className="text-sm text-muted-foreground mt-1">Add a note with text or drawing</p>
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
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Note Title Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="title" className="text-sm font-medium text-foreground">
                      Note Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...register('title', { required: 'Title is required' })}
                      placeholder="Enter note title..."
                      className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                </div>
              </div>

              {/* Content Tabs Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl p-1">
                    <TabsTrigger value="write" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">✏️ Write</TabsTrigger>
                    <TabsTrigger value="draw" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">🎨 Draw</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="write" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content" className="text-sm font-medium text-foreground">Content</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleDictation}
                        disabled={isTranscribing}
                        className={`rounded-full ${isDictating 
                          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                          : 'text-sky-600 border-sky-200 hover:bg-sky-50'}`}
                      >
                        {isTranscribing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing...</>
                        ) : isDictating ? (
                          <><MicOff className="w-4 h-4 mr-2" />Stop Dictation</>
                        ) : (
                          <><Mic className="w-4 h-4 mr-2" />Dictate</>
                        )}
                      </Button>
                    </div>
                    <div className="relative">
                      <Textarea 
                        id="content" 
                        {...register('content')} 
                        placeholder="Write your note content or click Dictate to speak..." 
                        className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary min-h-[160px]" 
                        rows={6} 
                      />
                      {isDictating && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-rose-500 text-sm">
                          <span className="animate-pulse">●</span> Recording...
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="draw" className="mt-4 space-y-4">
                    {isMobile ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowMobileDrawing(true)}
                          className="w-full py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 active:bg-slate-50"
                        >
                          <span className="text-4xl">🎨</span>
                          <span className="text-sm font-medium">Tap to open drawing canvas</span>
                        </button>
                        {drawingData && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-sm text-emerald-600 mb-2">✓ Drawing created</p>
                            <img src={drawingData} alt="Drawing preview" className="max-h-32 rounded-lg border" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Label className="text-sm font-medium text-foreground">Drawing Canvas</Label>
                        <DrawingCanvas onDrawingChange={setDrawingData} isFullscreen={true} />
                        {drawingData && (
                          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-sm text-emerald-600 mb-2">✓ Drawing created</p>
                            <img src={drawingData} alt="Drawing preview" className="max-h-32 rounded-lg border" />
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Color & Visibility Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Palette className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Color</Label>
                      <Select onValueChange={value => setValue('color', value as any)} value={watchedColor}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                          {colorOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${option.class}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Visibility</Label>
                      <Select onValueChange={value => setValue('visibility', value as any)} value={watchedVisibility}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                          <SelectItem value="private">🔒 Private</SelectItem>
                          <SelectItem value="team">👥 Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Link to Case/Client Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Link to Case
                        {caseId && <span className="text-emerald-600 text-xs ml-2">(Auto-linked)</span>}
                      </Label>
                      <CaseSelector
                        value={watch('case_id') || ''}
                        onValueChange={value => setValue('case_id', value)}
                        placeholder="Select a case..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Link to Client/Contact
                        {clientId && <span className="text-emerald-600 text-xs ml-2">(Auto-linked)</span>}
                      </Label>
                      <ClientSelector
                        value={watchedClientContactId || ''}
                        onValueChange={value => setValue('client_contact_id', value)}
                        placeholder="Select client or contact..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-sm font-medium text-foreground">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="icon" className="rounded-xl border-slate-200">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-sky-50 text-sky-700 rounded-full px-3 py-1 border-sky-200">
                            {tag}
                            <X className="w-3 h-3 ml-1 cursor-pointer hover:text-sky-900" onClick={() => removeTag(tag)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-full px-6 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full px-6 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? 'Creating...' : 'Create Note'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Mobile Drawing Sheet */}
        {isMobile && (
          <MobileDrawingSheet
            open={showMobileDrawing}
            onClose={() => setShowMobileDrawing(false)}
            onSave={setDrawingData}
            initialData={drawingData}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
