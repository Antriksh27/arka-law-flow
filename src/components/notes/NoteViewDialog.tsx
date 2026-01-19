import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
    case 'yellow':
      return 'bg-amber-100';
    case 'blue':
      return 'bg-sky-100';
    case 'green':
      return 'bg-emerald-100';
    case 'red':
      return 'bg-rose-100';
    case 'purple':
      return 'bg-violet-100';
    default:
      return 'bg-white';
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
  const [isPlaying, setIsPlaying] = React.useState(false);
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
        <DialogContent 
          className={`max-w-2xl max-h-[90vh] overflow-hidden p-0 border-0 ${getColorClasses(note.color)}`}
        >
          {/* Top action bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-black/10"
                onClick={() => togglePinMutation.mutate()}
                disabled={togglePinMutation.isPending}
              >
                {note.is_pinned ? (
                  <PinOff className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Pin className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-black/10"
                  onClick={onEdit}
                >
                  <Edit className="w-5 h-5 text-muted-foreground" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-black/10"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-black/10"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Content area */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Drawing - full width at top */}
            {hasDrawing && (
              <div className="w-full">
                <img 
                  src={drawingData} 
                  alt="Note drawing" 
                  className="w-full max-h-80 object-contain bg-white/50"
                />
              </div>
            )}

            <div className="px-6 py-4 space-y-4">
              {/* Title */}
              {note.title && (
                <h2 className="text-xl font-medium text-foreground">
                  {note.title}
                </h2>
              )}

              {/* Linked Case */}
              {note.cases?.case_title && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <FileText className="w-4 h-4" />
                  <span>{note.cases.case_title}</span>
                </div>
              )}

              {/* Audio Player */}
              {hasAudio && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                  <Button
                    onClick={handlePlayPause}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Audio recording</span>
                    </div>
                    <audio
                      ref={audioRef}
                      src={audioData}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                  </div>
                  <Button
                    onClick={downloadAudio}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 hover:bg-black/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Content */}
              {displayContent && (
                <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                </div>
              )}

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {note.tags.map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="text-sm text-muted-foreground bg-black/5 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-black/5 text-xs text-muted-foreground">
            <span>
              {note.profiles?.full_name && `By ${note.profiles.full_name}`}
            </span>
            <span>
              Edited {TimeUtils.formatDate(note.updated_at, 'MMM d, h:mm a')}
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
