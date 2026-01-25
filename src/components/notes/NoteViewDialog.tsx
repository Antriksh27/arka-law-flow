import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Edit, Trash2, Play, Pause, Download, X, FileText, Mic } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface NoteViewDialogProps {
  note: any;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'yellow': return 'bg-amber-50';
    case 'blue': return 'bg-sky-50';
    case 'green': return 'bg-emerald-50';
    case 'red': return 'bg-rose-50';
    case 'purple': return 'bg-violet-50';
    default: return 'bg-white';
  }
};

const getDataValue = (data: any) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data.value && data.value !== 'undefined') return data.value;
  return null;
};

export const NoteViewDialog: React.FC<NoteViewDialogProps> = ({
  note,
  open,
  onClose,
  onEdit,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const togglePinMutation = useMutation({
    mutationFn: async () => {
      if (!note) return;
      const { error } = await supabase
        .from('notes_v2')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: note?.is_pinned ? 'Note unpinned' : 'Note pinned',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update note',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!note) return;
      const { error } = await supabase
        .from('notes_v2')
        .delete()
        .eq('id', note.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note deleted' });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Failed to delete note',
        variant: 'destructive',
      });
    },
  });

  if (!note) return null;

  const drawingData = getDataValue(note.drawing_data);
  const audioData = getDataValue(note.audio_data);
  const hasDrawing = drawingData && drawingData.startsWith('data:image');
  const hasAudio = audioData && audioData.startsWith('data:audio');

  const displayContent = note.content && 
    !note.content.includes('[Drawing attached]') && 
    !note.content.includes('[Audio attached]') 
      ? note.content 
      : '';

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const downloadAudio = () => {
    if (audioData) {
      const link = document.createElement('a');
      link.href = audioData;
      link.download = `note-audio-${note.id}.wav`;
      link.click();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-0">
          <div className={`flex flex-col h-full max-h-[90vh] ${getColorClasses(note.color)}`}>
            {/* Header Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-slate-100"
                  onClick={() => togglePinMutation.mutate()}
                  disabled={togglePinMutation.isPending}
                >
                  {note.is_pinned ? (
                    <PinOff className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Pin className="w-5 h-5 text-slate-600" />
                  )}
                </Button>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-slate-100"
                    onClick={onEdit}
                  >
                    <Edit className="w-5 h-5 text-slate-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-slate-100"
                onClick={onClose}
              >
                <X className="w-5 h-5 text-slate-600" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Drawing - full width at top */}
              {hasDrawing && (
                <div className="w-full bg-white/50">
                  <img 
                    src={drawingData} 
                    alt="Note drawing" 
                    className="w-full max-h-80 object-contain"
                  />
                </div>
              )}

              <div className="px-6 py-5 space-y-4">
                {/* Title */}
                {note.title && (
                  <h2 className="text-xl font-semibold text-slate-900">
                    {note.title}
                  </h2>
                )}

                {/* Linked Case */}
                {note.cases?.case_title && (
                  <div className="flex items-center gap-2 text-sm text-primary bg-white/60 rounded-xl px-3 py-2 w-fit">
                    <FileText className="w-4 h-4" />
                    <span>{note.cases.case_title}</span>
                  </div>
                )}

                {/* Audio Player */}
                {hasAudio && (
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handlePlayPause}
                        size="icon"
                        className="h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">Audio recording</span>
                        </div>
                      </div>
                      <Button
                        onClick={downloadAudio}
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full hover:bg-slate-100"
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                    <audio
                      ref={audioRef}
                      src={audioData}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Content */}
                {displayContent && (
                  <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {displayContent}
                  </div>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {note.tags.map((tag: string, index: number) => (
                      <span 
                        key={index} 
                        className="text-sm text-slate-600 bg-white/60 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200/50 text-xs text-slate-500 bg-white/50">
              <span>
                {note.profiles?.full_name && `By ${note.profiles.full_name}`}
              </span>
              <span>
                Edited {TimeUtils.formatDate(note.updated_at, 'MMM d, h:mm a')}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-slate-50 border-0">
          <div className="flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl font-semibold text-slate-900">
                    Delete note?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-slate-500 mt-0.5">
                    This action cannot be undone
                  </AlertDialogDescription>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600">
                This note will be permanently deleted. This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <AlertDialogFooter className="px-6 py-4 bg-white border-t border-slate-100">
              <AlertDialogCancel className="rounded-full px-6 border-slate-200">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="rounded-full px-6 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
