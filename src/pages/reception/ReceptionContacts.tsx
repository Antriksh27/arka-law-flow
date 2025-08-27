import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, Phone, Mail, Calendar, Plus, Filter, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import AddContactDialog from '@/components/reception/AddContactDialog';
import { ConvertContactToClientDialog } from '@/components/reception/ConvertContactToClientDialog';
import EditContactDialog from '@/components/reception/EditContactDialog';
import ReceptionClientList from '@/components/reception/ReceptionClientList';

const ReceptionContacts = () => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('contacts');

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

  const handleConvertToClient = (contact: any) => {
    setSelectedContact(contact);
    setConvertDialogOpen(true);
  };

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact);
    setEditContactOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Contacts & Clients</h1>
          <p className="text-[#6B7280] mt-1">Manage contacts and clients</p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => setAddContactOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
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
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Organization</th>
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
                        <span className="text-sm text-[#6B7280]">{contact.organization || '-'}</span>
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
                        <Badge variant="outline">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConvertToClient(contact)}
                          >
                            Convert to Client
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditContact(contact)}
                          >
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
        </TabsContent>

        <TabsContent value="clients">
          <ReceptionClientList />
        </TabsContent>
      </Tabs>

      {/* Add Contact Modal */}
      <AddContactDialog 
        open={addContactOpen} 
        onOpenChange={setAddContactOpen} 
      />

      {/* Edit Contact Modal */}
      {selectedContact && (
        <EditContactDialog
          contact={selectedContact}
          open={editContactOpen}
          onOpenChange={setEditContactOpen}
        />
      )}

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
