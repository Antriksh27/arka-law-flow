import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MapPin, Building, Briefcase, Users, Calendar, UserCheck, Shield, FileText, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { InlineEditCard } from './InlineEditCard';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
interface ClientInformationProps {
  clientId: string;
}
export const ClientInformation: React.FC<ClientInformationProps> = ({
  clientId
}) => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const {
    data: client,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['client-full-info', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch internal notes
  const { data: internalNotes, isLoading: notesLoading } = useQuery({
    queryKey: ['client-internal-notes', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_internal_notes')
        .select(`
          *,
          creator:created_by(full_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching internal notes:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user && (role === 'office_staff' || role === 'admin')
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const { data, error } = await supabase
        .from('client_internal_notes')
        .insert({
          client_id: clientId,
          note: noteText.trim(),
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-internal-notes', clientId] });
      setNewNote('');
      setIsAddingNote(false);
      toast({
        title: "Success",
        description: "Internal note added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add internal note",
        variant: "destructive"
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('client_internal_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-internal-notes', clientId] });
      toast({
        title: "Success",
        description: "Internal note deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete internal note",
        variant: "destructive"
      });
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }
    addNoteMutation.mutate(newNote);
  };

  // Validation schemas
  const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }).or(z.literal(''));
  const phoneSchema = z.string().trim().max(20, { message: "Phone must be less than 20 characters" }).or(z.literal(''));
  const textSchema = (max: number) => z.string().trim().max(max, { message: `Must be less than ${max} characters` }).or(z.literal(''));

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>;
  }
  if (!client) {
    return <div className="text-center py-12 text-gray-500">
        Client information not found
      </div>;
  }

  // Define fields for each card
  const personalFields = [
    { key: 'full_name', label: 'Full Name', icon: User, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'email', label: 'Email', icon: Mail, type: 'email' as const, maxLength: 255, validation: emailSchema },
    { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' as const, maxLength: 20, validation: phoneSchema },
    { key: 'type', label: 'Client Type', icon: UserCheck, type: 'text' as const, maxLength: 50, validation: textSchema(50) },
  ];

  const addressFields = [
    { key: 'address', label: 'Address', icon: MapPin, type: 'text' as const, maxLength: 255, validation: textSchema(255) },
    { key: 'district', label: 'District', icon: MapPin, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'state', label: 'State', icon: MapPin, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'pin_code', label: 'PIN Code', icon: MapPin, type: 'text' as const, maxLength: 10, validation: textSchema(10) },
  ];

  const professionalFields = [
    { key: 'organization', label: 'Organization', icon: Building, type: 'text' as const, maxLength: 200, validation: textSchema(200) },
    { key: 'designation', label: 'Designation', icon: Briefcase, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'company_address', label: 'Company Address', icon: MapPin, type: 'text' as const, maxLength: 255, validation: textSchema(255) },
    { key: 'company_phone', label: 'Company Phone', icon: Phone, type: 'tel' as const, maxLength: 20, validation: phoneSchema },
    { key: 'company_email', label: 'Company Email', icon: Mail, type: 'email' as const, maxLength: 255, validation: emailSchema },
  ];

  const referenceFields = [
    { key: 'referred_by_name', label: 'Referred By', icon: Users, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'referred_by_phone', label: 'Reference Phone', icon: Phone, type: 'tel' as const, maxLength: 20, validation: phoneSchema },
  ];

  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: any;
    label: string;
    value: string | null | undefined;
  }) => {
    return <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <span className="text-sm text-gray-600">{label}: </span>
          <span className={`text-sm ${value ? 'font-medium text-gray-900' : 'italic text-gray-400'}`}>
            {value || 'Not provided'}
          </span>
        </div>
      </div>;
  };

  return <div className="space-y-6">
      {/* Personal Details */}
      <InlineEditCard
        title="Personal Details"
        icon={User}
        fields={personalFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Address Information */}
      <InlineEditCard
        title="Address Information"
        icon={MapPin}
        fields={addressFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Professional Details */}
      <InlineEditCard
        title="Professional Details"
        icon={Building}
        fields={professionalFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Reference Information */}
      <InlineEditCard
        title="Reference Information"
        icon={Users}
        fields={referenceFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Internal Office Notes - Only visible to office_staff, admin, and note creators */}
      {(role === 'office_staff' || role === 'admin') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Internal Office Notes</CardTitle>
                <Badge variant="outline" className="text-xs">Staff Only</Badge>
              </div>
              {!isAddingNote && (
                <Button
                  size="sm"
                  onClick={() => setIsAddingNote(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAddingNote && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Textarea
                  placeholder="Enter internal note (visible only to office staff and admins)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNote('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {notesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : internalNotes && internalNotes.length > 0 ? (
              <div className="space-y-3">
                {internalNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-4 bg-muted rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {note.creator?.full_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {TimeUtils.formatDate(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                      {(role === 'admin' || note.created_by === user?.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this note?')) {
                              deleteNoteMutation.mutate(note.id);
                            }
                          }}
                          disabled={deleteNoteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No internal notes yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle>Account Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Calendar} label="Created Date" value={TimeUtils.formatDate(client.created_at)} />
          <InfoRow icon={Calendar} label="Last Edited Date" value={TimeUtils.formatDate(client.updated_at)} />
        </CardContent>
      </Card>
    </div>;
};