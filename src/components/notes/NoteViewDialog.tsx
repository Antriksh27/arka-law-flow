
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Pin, Calendar, User, FileText, Play, Pause, Download, Trash2, PinOff } from 'lucide-react';
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

  // Pin/Unpin mutation
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
      queryClient.invalidateQueries({ queryKey: ['client-notes-v2'] });
      toast({
        title: note?.is_pinned ? 'Note unpinned' : 'Note pinned',
        description: note?.is_pinned ? 'Note has been unpinned' : 'Note has been pinned to top',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
      console.error('Error toggling pin:', error);
    },
  });

  // Delete mutation
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
      queryClient.invalidateQueries({ queryKey: ['client-notes-v2'] });
      toast({
        title: 'Note deleted',
        description: 'Note has been permanently deleted',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
      console.error('Error deleting note:', error);
    },
  });

  if (!note) return null;

  // Helper function to get actual data value
  const getDataValue = (data: any) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data.value && data.value !== 'undefined') return data.value;
    return null;
  };

  const drawingData = getDataValue(note.drawing_data);
  const audioData = getDataValue(note.audio_data);

  console.log('Drawing data in view dialog:', drawingData);
  console.log('Audio data in view dialog:', audioData);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'border-t-yellow-400 bg-yellow-50';
      case 'blue':
        return 'border-t-blue-400 bg-blue-50';
      case 'green':
        return 'border-t-green-400 bg-green-50';
      case 'red':
        return 'border-t-red-400 bg-red-50';
      default:
        return 'border-t-gray-400 bg-gray-50';
    }
  };

  const getVisibilityIcon = () => {
    return note.visibility === 'private' ? 
      <EyeOff className="w-4 h-4 text-gray-500" /> : 
      <Eye className="w-4 h-4 text-gray-500" />;
  };

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex-1 pr-4">
              {note.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {note.id !== 'client-notes' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinMutation.mutate();
                    }}
                    disabled={togglePinMutation.isPending}
                  >
                    {note.is_pinned ? (
                      <>
                        <PinOff className="w-4 h-4 mr-1" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4 mr-1" />
                        Pin
                      </>
                    )}
                  </Button>
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onEdit}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              {getVisibilityIcon()}
              {note.is_pinned && <Pin className="w-4 h-4 text-yellow-600 fill-current" />}
            </div>
          </div>
        </DialogHeader>

        <div className={`rounded-lg border-t-4 p-6 ${getColorClasses(note.color)}`}>
          {/* Linked Case */}
          {note.cases && (
            <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded">
              <FileText className="w-4 h-4" />
              <span>Linked to case: {note.cases.title}</span>
            </div>
          )}

          {/* Audio Recording */}
          {audioData && audioData.startsWith('data:audio') && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Audio Recording</h3>
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handlePlayPause}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <div className="flex-1">
                    <audio
                      ref={audioRef}
                      src={audioData}
                      onEnded={handleAudioEnded}
                      className="w-full"
                      controls
                    />
                  </div>
                  <Button
                    onClick={downloadAudio}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Drawing */}
          {drawingData && drawingData.startsWith('data:image') && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Drawing</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img 
                  src={drawingData} 
                  alt="Note drawing" 
                  className="w-full max-h-96 object-contain"
                  onError={(e) => {
                    console.error('Failed to load drawing in view dialog:', e);
                  }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          {note.content && !note.content.includes('[Drawing attached]') && !note.content.includes('[Audio attached]') && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Content</h3>
              <div className="text-gray-800 whitespace-pre-wrap bg-white p-4 rounded border">
                {note.content}
              </div>
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-white">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Created by {note.profiles?.full_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created {TimeUtils.formatDate(note.created_at, 'MMM d, yyyy')} (IST)</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              {note.visibility}
            </Badge>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
