import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus, Mic, MicOff, Square, Play, Pause, Trash2, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { AudioRecorder } from '@/utils/audioRecorder';
import { useDeepgramTranscription } from '@/hooks/useDeepgramTranscription';
interface CreateNoteMultiModalProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  clientId?: string;
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
  isPinned = false
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const { transcribe, isProcessing: isTranscribing } = useDeepgramTranscription();
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
      visibility: 'private',
      color: 'gray',
      tags: [],
      case_id: caseId || 'no-case',
      client_contact_id: clientId || ''
    }
  });
  const watchedTags = watch('tags') || [];
  const watchedClientContactId = watch('client_contact_id');
  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');
      let finalContent = data.content || '';

      // Convert audio blob to base64 if available
      let audioDataUrl = null;
      if (audioBlob) {
        audioDataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });

        // Only add placeholder text if there's no other content
        if (!finalContent.trim()) {
          finalContent = '[Audio recording attached]';
        }
      }

      // Add drawing placeholder if available and no content
      if (drawingData && !finalContent.trim()) {
        finalContent = '[Drawing attached]';
      }

      // Use client_contact_id as client_id (notes_v2 only supports client_id)
      const clientId = data.client_contact_id || null;

      const noteData = {
        title: data.title,
        content: finalContent || null,
        case_id: data.case_id === 'no-case' ? null : data.case_id,
        client_id: clientId,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags,
        drawing_data: drawingData,
        audio_data: audioDataUrl,
        is_pinned: isPinned,
        created_by: user.data.user.id
      };
      console.log('Saving note with data:', noteData);
      const {
        error
      } = await supabase.from('notes_v2').insert(noteData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notes']
      });
      queryClient.invalidateQueries({
        queryKey: ['case-notes']
      });
      queryClient.invalidateQueries({
        queryKey: ['client-notes-v2']
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-data']
      });
      toast({
        title: "Note created successfully"
      });
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
  const startRecording = async () => {
    try {
      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak now..."
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    try {
      const blob = await audioRecorderRef.current.stopRecording();
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setIsRecording(false);
    } catch (error) {
      toast({
        title: "Stop recording failed",
        description: "Could not stop recording",
        variant: "destructive"
      });
    }
  };
  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };
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
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setNewTag('');
    setActiveTab('write');
  };
  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
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
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const toggleDictation = async () => {
    if (isDictating) {
      // Stop dictation and transcribe
      setIsDictating(false);
      
      try {
        const blob = await audioRecorderRef.current.stopRecording();
        
        toast({
          title: "Transcribing with Deepgram...",
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
          const currentContent = watch('content') || '';
          const newContent = currentContent ? `${currentContent}\n\n${result.text}` : result.text;
          setValue('content', newContent);
          
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
      // Start dictation
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
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`overflow-y-auto bg-white p-6 transition-all duration-200 ${
        isFullscreen 
          ? 'w-screen max-w-none h-screen max-h-none rounded-none' 
          : 'w-[calc(100vw-4rem)] max-w-6xl h-[calc(100vh-4rem)] max-h-[90vh]'
      }`}>
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create New Note</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="write" className="bg-slate-900 hover:bg-slate-800 text-slate-50">✏️ Write</TabsTrigger>
              <TabsTrigger value="draw" className="text-slate-50 bg-slate-900 hover:bg-slate-800">🎨 Draw</TabsTrigger>
              <TabsTrigger value="record" className="text-slate-50 bg-slate-900 hover:bg-slate-800">🎤 Record</TabsTrigger>
            </TabsList>
            
            <TabsContent value="write" className="space-y-4">
              <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Content
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleDictation}
                  disabled={isTranscribing}
                  className={`${isDictating 
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                    : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : isDictating ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Dictation
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Dictate
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <Textarea 
                  id="content" 
                  {...register('content')} 
                  placeholder="Write your note content or click Dictate to speak..." 
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[200px]" 
                  rows={8} 
                />
                {isDictating && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-2 text-red-500 text-sm">
                    <span className="animate-pulse">●</span> Recording...
                  </div>
                )}
              </div>
              </div>
            </TabsContent>
            
            <TabsContent value="draw" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Drawing Canvas
                </Label>
                <DrawingCanvas onDrawingChange={setDrawingData} />
                {drawingData && <div className="mt-2 p-2 border border-gray-200 rounded-lg">
                    <p className="text-sm text-green-600 mb-2">✓ Drawing created</p>
                    <img src={drawingData} alt="Drawing preview" className="max-h-32 rounded border" />
                  </div>}
              </div>
            </TabsContent>
            
            <TabsContent value="record" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Audio Recording
                </Label>
                
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  {!audioBlob ? <div className="flex items-center gap-2">
                      <Button type="button" onClick={isRecording ? stopRecording : startRecording} className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                        {isRecording ? <>
                            <Square className="w-4 h-4 mr-2" />
                            Stop Recording
                          </> : <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </>}
                      </Button>
                      {isRecording && <span className="text-red-600 animate-pulse">Recording...</span>}
                    </div> : <div className="flex items-center gap-2 w-full">
                      <Button type="button" onClick={playAudio} className="bg-green-600 hover:bg-green-700 text-white">
                        {isPlaying ? <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </> : <>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </>}
                      </Button>
                      <span className="text-sm text-green-600 flex-1">✓ Recording ready</span>
                      <Button type="button" onClick={deleteRecording} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>}
                </div>
                
                {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-sm font-medium text-gray-700">
                Visibility
              </Label>
              <Select onValueChange={value => setValue('visibility', value as any)} defaultValue="private">
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
              <Select onValueChange={value => setValue('color', value as any)} defaultValue="gray">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
                Link to Case (Optional) {caseId && <span className="text-green-600 text-xs">(Auto-linked)</span>}
              </Label>
              <CaseSelector
                value={watch('case_id') || ''}
                onValueChange={value => setValue('case_id', value)}
                placeholder="Select a case..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_contact_id" className="text-sm font-medium text-gray-700">
                Link to Client/Contact (Optional) {clientId && <span className="text-green-600 text-xs">(Auto-linked)</span>}
              </Label>
              <ClientSelector
                value={watchedClientContactId || ''}
                onValueChange={value => setValue('client_contact_id', value)}
                placeholder="Select client or contact..."
              />
            </div>
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
            <Button type="button" variant="outline" onClick={onClose} className="px-6 py-2 border-gray-300 bg-red-700 hover:bg-red-600 text-slate-50">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6 py-2 text-white bg-slate-800 hover:bg-slate-700">
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};