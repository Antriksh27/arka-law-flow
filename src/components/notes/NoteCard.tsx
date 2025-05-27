
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Pin, Edit, Trash2, FileText, Calendar, User, Mic } from 'lucide-react';
import { format } from 'date-fns';

interface NoteCardProps {
  note: any;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: (isPinned: boolean) => void;
  onView: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onView
}) => {
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
    return note.visibility === 'private' ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />;
  };

  const getContentPreview = (content: string, maxLength: number = 120) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  console.log('Note data in card:', note);
  console.log('Drawing data:', note.drawing_data);
  console.log('Audio data:', note.audio_data);

  return (
    <Card className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-t-4 ${getColorClasses(note.color)} hover:scale-[1.02]`}>
      <CardContent className="p-5">
        {/* Header with pin and visibility */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getVisibilityIcon()}
            {note.is_pinned}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onTogglePin(!note.is_pinned)} className="h-8 w-8 p-0 hover:bg-gray-100">
              <Pin className={`w-3 h-3 ${note.is_pinned ? 'text-yellow-600 fill-current' : 'text-gray-400'}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 hover:bg-gray-100">
              <Edit className="w-3 h-3 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 hover:bg-red-100">
              <Trash2 className="w-3 h-3 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Clickable Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base cursor-pointer hover:text-blue-600 transition-colors" onClick={onView}>
          {note.title}
        </h3>

        {/* Audio Recording Preview */}
        {note.audio_data && (
          <div className="mb-3 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            <Mic className="w-3 h-3" />
            <span>Audio recording</span>
          </div>
        )}

        {/* Drawing Preview - Updated logic */}
        {note.drawing_data && note.drawing_data.trim() !== '' && (
          <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
            <img 
              src={note.drawing_data} 
              alt="Drawing preview" 
              className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={onView}
              onError={(e) => {
                console.error('Failed to load drawing image:', e);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Drawing image loaded successfully');
              }}
            />
          </div>
        )}

        {/* Fallback text for debugging */}
        {note.drawing_data && note.drawing_data.trim() === '' && (
          <div className="mb-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            Drawing data is empty
          </div>
        )}

        {/* Content Preview */}
        {note.content && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {getContentPreview(note.content)}
          </p>
        )}

        {/* Linked Case */}
        {note.cases && (
          <div className="flex items-center gap-1 mb-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <FileText className="w-3 h-3" />
            <span className="truncate">{note.cases.title}</span>
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs bg-white">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-white">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate">{note.profiles?.full_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(note.updated_at), 'MMM d')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
