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
import { X, Plus, Mic, MicOff, Square, Play, Pause, Trash2 } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';

interface CreateNoteMultiModalProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
}

interface NoteFormData {
  title: string;
  content?: string;
  case_id?: string;
  visibility: 'private' | 'team';
  color: 'yellow' | 'blue' | 'green' | 'red' | 'gray';
  tags: string[];
}

export const CreateNoteMultiModal: React.FC<CreateNoteMultiModalProps> = ({
  open,
  onClose,
  caseId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
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
      case_id: caseId || 'no-case'
    }
  });

  const watchedTags = watch('tags') || [];

  // Fetch cases for linking
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, title')
        .eq('status', 'open')
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      let finalContent = data.content || '';
      
      // Add drawing data if available
      if (drawingData) {
        finalContent += '\n\n[Drawing attached]';
        // In a real implementation, you'd upload the drawing to storage
      }
      
      // Add audio note if available
      if (audioBlob) {
        finalContent += '\n\n[Audio recording attached]';
        // In a real implementation, you'd upload the audio to storage
      }

      const noteData = {
        title: data.title,
        content: finalContent,
        case_id: data.case_id === 'no-case' ? null : data.case_id,
        visibility: data.visibility,
        color: data.color,
        tags: data.tags
      };

      const { error } = await supabase.from('notes_v2').insert(noteData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: "Note created successfully" });
      handleReset();
      onClose();
    },
    onError: (error) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  const colorOptions = [
    { value: 'gray', label: 'Gray', class: 'bg-gray-100' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-100' },
    { value: 'green', label: 'Green', class: 'bg-green-100' },
    { value: 'red', label: 'Red', class: 'bg-red-100' },
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="write">✏️ Write</TabsTrigger>
              <TabsTrigger value="draw">🎨 Draw</TabsTrigger>
              <TabsTrigger value="record">🎤 Record</TabsTrigger>
            </TabsList>
            
            <TabsContent value="write" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Content
                </Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="Write your note content..."
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[200px]"
                  rows={8}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="draw" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Drawing Canvas
                </Label>
                <DrawingCanvas onDrawingChange={setDrawingData} />
              </div>
            </TabsContent>
            
            <TabsContent value="record" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Audio Recording
                </Label>
                
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  {!audioBlob ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                      {isRecording && (
                        <span className="text-red-600 animate-pulse">Recording...</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        type="button"
                        onClick={playAudio}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </>
                        )}
                      </Button>
                      <span className="text-sm text-gray-600 flex-1">Recording ready</span>
                      <Button
                        type="button"
                        onClick={deleteRecording}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} className="hidden" />
                )}
              </div>
            </TabsContent>
          </Tabs>

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
            <Select onValueChange={(value) => setValue('case_id', value)} defaultValue={caseId || 'no-case'}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                <SelectItem value="no-case">No case</SelectItem>
                {cases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
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
