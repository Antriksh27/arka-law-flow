import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Pin, Calendar, User, Mic, Pencil, ChevronRight } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';

interface MobileNoteCardProps {
  note: any;
  onClick: () => void;
}

const getColorAccent = (color: string) => {
  switch (color) {
    case 'yellow':
      return 'border-l-yellow-400 bg-yellow-50/50';
    case 'blue':
      return 'border-l-blue-400 bg-blue-50/50';
    case 'green':
      return 'border-l-green-400 bg-green-50/50';
    case 'red':
      return 'border-l-red-400 bg-red-50/50';
    case 'purple':
      return 'border-l-purple-400 bg-purple-50/50';
    default:
      return 'border-l-border bg-card';
  }
};

const getContentPreview = (content: string, maxLength: number = 80) => {
  if (!content) return '';
  // Filter out placeholder text
  if (content.includes('[Drawing attached]') || content.includes('[Audio attached]')) {
    return '';
  }
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

const getDataValue = (data: any) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data.value && data.value !== 'undefined') return data.value;
  return null;
};

export const MobileNoteCard: React.FC<MobileNoteCardProps> = ({ note, onClick }) => {
  const drawingData = getDataValue(note.drawing_data);
  const audioData = getDataValue(note.audio_data);
  const hasDrawing = drawingData && drawingData.startsWith('data:image');
  const hasAudio = audioData && audioData.startsWith('data:audio');
  const contentPreview = getContentPreview(note.content);

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border border-l-4 p-4 active:scale-[0.98] transition-all duration-200 shadow-sm ${getColorAccent(note.color)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {note.is_pinned && (
            <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
          <h3 className="font-semibold text-foreground text-base truncate">
            {note.title || 'Untitled Note'}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {note.visibility === 'private' ? (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Drawing Preview */}
      {hasDrawing && (
        <div className="mb-3 rounded-xl overflow-hidden border border-border bg-white">
          <img 
            src={drawingData} 
            alt="Drawing preview" 
            className="w-full h-24 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content Preview */}
      {contentPreview && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {contentPreview}
        </p>
      )}

      {/* Indicators Row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {hasAudio && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-100 text-purple-700">
            <Mic className="w-3 h-3" />
            <span className="text-xs font-medium">Audio</span>
          </div>
        )}
        {hasDrawing && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
            <Pencil className="w-3 h-3" />
            <span className="text-xs font-medium">Drawing</span>
          </div>
        )}
        {note.cases?.case_title && (
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 rounded-full px-2 py-0.5">
            {note.cases.case_title}
          </Badge>
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.slice(0, 3).map((tag: string, index: number) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5"
            >
              #{tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge 
              variant="outline" 
              className="text-xs bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5"
            >
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{note.profiles?.full_name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          <span>{TimeUtils.formatDate(note.updated_at, 'MMM d, h:mm a')}</span>
        </div>
      </div>
    </div>
  );
};
