import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Phone, Mail, Calendar, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import AddContactDialog from '@/components/reception/AddContactDialog';
import { ConvertContactToClientDialog } from '@/components/reception/ConvertContactToClientDialog';

const ReceptionContacts = () => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Check for action parameter to auto-open dialogs
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setAddContactOpen(true);
      // Clear the parameter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['reception-contacts', firmId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!firmId
  });

  // Convert to client mutation
  const convertToClientMutation = useMutation({
    mutationFn: async (contact: any) => {
      // First create the client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: contact.name,
          email: contact.email,
          phone: contact.phone,
          notes: contact.notes,
          firm_id: firmId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Then update the contact as converted
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          converted_to_client: true,
          converted_client_id: clientData.id,
        })
        .eq('id', contact.id);

      if (updateError) throw updateError;

      return clientData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-contacts'] });
      toast({
        title: "Success",
        description: "Contact converted to client successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to convert contact to client.",
        variant: "destructive",
      });
    }
  });

  const handleConvertToClient = (contact: any) => {
    console.log('ReceptionContacts: Converting contact to client, contact data:', contact);
    setSelectedContact(contact);
    setConvertDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Contacts</h1>
          <p className="text-[#6B7280] mt-1">Manage pre-client contacts and convert them to clients</p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => setAddContactOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
            <Input
              placeholder="Search contacts by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-[#111827]">
            Contact List ({contacts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-[#6B7280]">Loading contacts...</div>
            </div>
          ) : contacts?.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#6B7280]">No contacts found</p>
              <p className="text-sm text-[#6B7280] mt-1">Start by adding your first contact</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Purpose</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Last Visit</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts?.map((contact) => (
                    <tr key={contact.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827]">{contact.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[#6B7280]">{contact.visit_purpose || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                          <Calendar className="w-3 h-3" />
                          {contact.last_visited_at ? format(new Date(contact.last_visited_at), 'MMM d, yyyy') : 'Never'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {contact.converted_to_client ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Converted</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {!contact.converted_to_client && (
                            <Button
                              size="sm"
                              onClick={() => handleConvertToClient(contact)}
                              disabled={convertToClientMutation.isPending}
                            >
                              Convert to Client
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Modal */}
      <AddContactDialog 
        open={addContactOpen} 
        onOpenChange={setAddContactOpen} 
      />

      {/* Convert Contact to Client Modal */}
      {selectedContact && (
        <ConvertContactToClientDialog
          contact={selectedContact}
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
        />
      )}
    </div>
  );
};

export default ReceptionContacts;
