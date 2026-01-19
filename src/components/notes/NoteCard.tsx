import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pin, Edit, Trash2, Mic, Pencil, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteCardProps {
  note: any;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: (isPinned: boolean) => void;
  onView: () => void;
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'yellow':
      return 'bg-amber-100 border-amber-200 hover:shadow-amber-200/50';
    case 'blue':
      return 'bg-sky-100 border-sky-200 hover:shadow-sky-200/50';
    case 'green':
      return 'bg-emerald-100 border-emerald-200 hover:shadow-emerald-200/50';
    case 'red':
      return 'bg-rose-100 border-rose-200 hover:shadow-rose-200/50';
    case 'purple':
      return 'bg-violet-100 border-violet-200 hover:shadow-violet-200/50';
    default:
      return 'bg-white border-border hover:shadow-gray-200/50';
  }
};

const getDataValue = (data: any) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data.value && data.value !== 'undefined') return data.value;
  return null;
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onView
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const drawingData = getDataValue(note.drawing_data);
  const audioData = getDataValue(note.audio_data);
  const hasDrawing = drawingData && drawingData.startsWith('data:image');
  const hasAudio = audioData && audioData.startsWith('data:audio');
  
  // Filter out placeholder content
  const displayContent = note.content && 
    !note.content.includes('[Drawing attached]') && 
    !note.content.includes('[Audio attached]') 
      ? note.content 
      : '';

  return (
    <div
      className={`relative rounded-xl border p-4 cursor-pointer break-inside-avoid mb-4
        hover:shadow-lg transition-all duration-200 group ${getColorClasses(note.color)}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
    >
      {/* Hover actions - Google Keep style bottom bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 
          rounded-b-xl bg-black/5 backdrop-blur-sm transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-black/10"
            onClick={() => onTogglePin(!note.is_pinned)}
          >
            <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-current text-foreground' : 'text-muted-foreground'}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-black/10"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/10">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pin indicator - visible when pinned */}
      {note.is_pinned && !isHovered && (
        <div className="absolute top-2 right-2">
          <Pin className="w-4 h-4 text-muted-foreground fill-current" />
        </div>
      )}

      {/* Drawing Preview - full width like Google Keep */}
      {hasDrawing && (
        <div className="-mx-4 -mt-4 mb-3">
          <img 
            src={drawingData} 
            alt="Drawing" 
            className="w-full object-cover max-h-48 rounded-t-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Title */}
      {note.title && (
        <h3 className="font-medium text-foreground mb-2 line-clamp-2">
          {note.title}
        </h3>
      )}

      {/* Content Preview */}
      {displayContent && (
        <p className="text-sm text-muted-foreground line-clamp-8 mb-3 whitespace-pre-wrap">
          {displayContent}
        </p>
      )}

      {/* Compact indicators row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {hasAudio && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-200/60">
            <Mic className="w-3 h-3 text-violet-600" />
            <span className="text-[10px] text-violet-700">Audio</span>
          </div>
        )}
        {note.cases?.case_title && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0 rounded-full">
            {note.cases.case_title}
          </Badge>
        )}
      </div>

      {/* Tags - compact labels like Google Keep */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 absolute bottom-10 left-4 right-4">
          {note.tags.slice(0, 3).map((tag: string, index: number) => (
            <span 
              key={index} 
              className="text-xs text-muted-foreground bg-black/5 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
