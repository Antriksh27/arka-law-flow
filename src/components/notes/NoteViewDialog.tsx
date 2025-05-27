
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Pin, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface NoteViewDialogProps {
  note: any;
  open: boolean;
  onClose: () => void;
}

export const NoteViewDialog: React.FC<NoteViewDialogProps> = ({
  note,
  open,
  onClose,
}) => {
  if (!note) return null;

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex-1 pr-4">
              {note.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
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

          {/* Drawing */}
          {note.drawing_data && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Drawing</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img 
                  src={note.drawing_data} 
                  alt="Note drawing" 
                  className="w-full max-h-96 object-contain"
                />
              </div>
            </div>
          )}

          {/* Content */}
          {note.content && (
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
                <span>Created {format(new Date(note.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              {note.visibility}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
