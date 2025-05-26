
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Plus, Pin, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface CaseNotesProps {
  caseId: string;
}

export const CaseNotes: React.FC<CaseNotesProps> = ({ caseId }) => {
  const { data: notes, isLoading } = useQuery({
    queryKey: ['case-notes', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select(`
          *,
          profiles!notes_v2_created_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'private' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notes</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className={`border rounded-lg p-4 relative hover:shadow-md transition-shadow ${
                note.color ? `bg-${note.color}-50 border-${note.color}-200` : 'bg-white border-gray-200'
              }`}
            >
              {note.is_pinned && (
                <Pin className="absolute top-2 right-2 w-4 h-4 text-gray-400" />
              )}
              
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm pr-6">{note.title}</h4>
                {getVisibilityIcon(note.visibility)}
              </div>
              
              {note.content && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{note.content}</p>
              )}
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{note.profiles?.full_name}</span>
                <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <StickyNote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No notes created yet</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Note
          </Button>
        </div>
      )}
    </div>
  );
};
