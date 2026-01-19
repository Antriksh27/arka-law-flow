import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Pin, Mic, Pencil } from 'lucide-react';

interface MobileNoteCardProps {
  note: any;
  onClick: () => void;
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'yellow':
      return 'bg-amber-100 border-amber-200';
    case 'blue':
      return 'bg-sky-100 border-sky-200';
    case 'green':
      return 'bg-emerald-100 border-emerald-200';
    case 'red':
      return 'bg-rose-100 border-rose-200';
    case 'purple':
      return 'bg-violet-100 border-violet-200';
    default:
      return 'bg-white border-border';
  }
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
  
  // Filter out placeholder content
  const displayContent = note.content && 
    !note.content.includes('[Drawing attached]') && 
    !note.content.includes('[Audio attached]') 
      ? note.content 
      : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-3 break-inside-avoid mb-3 cursor-pointer 
        hover:shadow-md active:scale-[0.98] transition-all duration-200 ${getColorClasses(note.color)}`}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="flex justify-end mb-1">
          <Pin className="w-3.5 h-3.5 text-muted-foreground fill-current" />
        </div>
      )}

      {/* Title */}
      {note.title && (
        <h3 className="font-medium text-foreground text-sm mb-1.5 line-clamp-2">
          {note.title}
        </h3>
      )}

      {/* Drawing Preview - shown prominently like Google Keep */}
      {hasDrawing && (
        <div className="mb-2 -mx-3 -mt-1">
          <img 
            src={drawingData} 
            alt="Drawing" 
            className="w-full object-cover max-h-40 rounded-t-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content Preview */}
      {displayContent && (
        <p className="text-xs text-muted-foreground line-clamp-6 mb-2 whitespace-pre-wrap">
          {displayContent}
        </p>
      )}

      {/* Compact indicators row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {hasAudio && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-200/60">
            <Mic className="w-3 h-3 text-violet-600" />
          </div>
        )}
        {hasDrawing && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-200/60">
            <Pencil className="w-3 h-3 text-sky-600" />
          </div>
        )}
        {note.cases?.case_title && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-0 rounded">
            {note.cases.case_title}
          </Badge>
        )}
      </div>

      {/* Tags - compact like Google Keep labels */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 3).map((tag: string, index: number) => (
            <span 
              key={index} 
              className="text-[10px] text-muted-foreground bg-black/5 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
