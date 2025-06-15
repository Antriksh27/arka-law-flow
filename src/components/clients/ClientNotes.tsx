import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pin, Eye, EyeOff } from 'lucide-react';

interface ClientNotesProps {
  clientId: string;
}

export const ClientNotes: React.FC<ClientNotesProps> = ({ clientId }) => {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select(`
          *,
          created_by:profiles!notes_v2_created_by_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'private' ? (
      <EyeOff className="w-4 h-4 text-gray-400" />
    ) : (
      <Eye className="w-4 h-4 text-gray-400" />
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Notes</CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes added for this client
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className={`border rounded-lg p-4 hover:bg-gray-50 ${
                  note.is_pinned ? 'border-primary/20 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.is_pinned && (
                      <Pin className="w-4 h-4 text-primary" />
                    )}
                    <h3 className="font-medium text-gray-900">
                      {note.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getVisibilityIcon(note.visibility)}
                    <Badge variant="outline" className="text-xs">
                      {note.visibility}
                    </Badge>
                  </div>
                </div>
                
                {note.content && (
                  <p className="text-gray-600 mb-3 text-sm">
                    {note.content.substring(0, 200)}
                    {note.content.length > 200 ? '...' : ''}
                  </p>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    By {note.created_by?.full_name} • {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  {note.color && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: note.color }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
