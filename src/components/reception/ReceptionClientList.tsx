import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, Mail, Calendar, Edit, User, Star } from 'lucide-react';
import { format } from 'date-fns';
import { EditClientDialog } from '@/components/clients/EditClientDialog';

interface ReceptionClient {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  assigned_lawyer_id?: string;
  created_at: string;
  organization?: string;
  address?: string;
  notes?: string;
  is_vip?: boolean;
}

const ReceptionClientList = () => {
  const { firmId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ReceptionClient | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch clients
  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['reception-clients', firmId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!firmId
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'lead': return 'warning';
      case 'inactive': return 'outline';
      case 'new': return 'error';
      default: return 'outline';
    }
  };

  const handleEditClient = (client: ReceptionClient) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedClient(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
            <Input
              placeholder="Search clients by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-[#111827]">
            Client List ({clients?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-[#6B7280]">Loading clients...</div>
            </div>
          ) : clients?.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#6B7280]">No clients found</p>
              <p className="text-sm text-[#6B7280] mt-1">No clients match your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Organization</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-[#111827]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients?.map((client) => (
                    <tr key={client.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827] flex items-center gap-2">
                          {client.full_name}
                          {client.is_vip && (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-label="VIP Client" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[#6B7280]">{client.organization || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(client.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      {selectedClient && (
        <EditClientDialog
          client={{
            ...selectedClient,
            status: selectedClient.status as 'active' | 'inactive' | 'lead' | 'prospect' | 'new'
          }}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ReceptionClientList;