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
  // Fetch both notes_v2 and client notes
  const { data: notesV2 = [], isLoading: notesV2Loading } = useQuery({
    queryKey: ['client-notes-v2', clientId],
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

  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('notes, created_at, created_by, profiles!clients_created_by_fkey(full_name)')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const isLoading = notesV2Loading || clientLoading;

  // Combine both types of notes
  const allNotes = [];
  
  // Add client notes if they exist
  if (clientData?.notes) {
    allNotes.push({
      id: 'client-notes',
      title: 'Conversion Notes',
      content: clientData.notes,
      created_at: clientData.created_at,
      created_by: clientData.profiles,
      visibility: 'team',
      is_pinned: false,
      tags: ['conversion'],
      color: null
    });
  }
  
  // Add notes_v2
  allNotes.push(...notesV2);
  
  // Sort by created_at
  const notes = allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
                  <div className="text-gray-600 mb-3 text-sm whitespace-pre-wrap">
                    {note.id === 'client-notes' ? (
                      // Show full content for conversion notes
                      note.content
                    ) : (
                      // Show truncated content for other notes
                      <>
                        {note.content.substring(0, 200)}
                        {note.content.length > 200 ? '...' : ''}
                      </>
                    )}
                  </div>
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
