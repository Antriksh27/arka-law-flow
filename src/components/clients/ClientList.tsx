import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddClientDialog } from './AddClientDialog';
import { EditClientDialog } from './EditClientDialog';
import { ClientDetailsDialog } from './ClientDetailsDialog';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect';
  organization?: string;
  assigned_lawyer_name?: string;
  active_case_count: number;
  created_at: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'lead' | 'prospect';

export const ClientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['clients', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('client_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
  });

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
      refetch();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'lead': return 'outline';
      case 'prospect': return 'destructive';
      default: return 'default';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage your clients and their information</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search clients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No clients found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first client to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lawyer</TableHead>
                  <TableHead>Active Cases</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{client.full_name}</div>
                        {client.organization && (
                          <div className="text-sm text-gray-500">{client.organization}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.email && <div>{client.email}</div>}
                        {client.phone && <div className="text-gray-600">{client.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(client.status)}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.assigned_lawyer_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.active_case_count}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingClient(client)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingClient(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this client?')) {
                              handleDeleteClient(client.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddClientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          refetch();
          setShowAddDialog(false);
        }}
      />

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          onSuccess={() => {
            refetch();
            setEditingClient(null);
          }}
        />
      )}

      {viewingClient && (
        <ClientDetailsDialog
          client={viewingClient}
          open={!!viewingClient}
          onOpenChange={(open) => !open && setViewingClient(null)}
        />
      )}
    </div>
  );
};
