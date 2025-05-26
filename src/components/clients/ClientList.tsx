
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddClientDialog } from './AddClientDialog';
import { EditClientDialog } from './EditClientDialog';
import { ClientDetailsDialog } from './ClientDetailsDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const {
    data: clients = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['clients', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase.from('client_stats').select('*').order('created_at', {
        ascending: false
      });
      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    }
  });

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
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
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-900"
            />
          </div>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as StatusFilter)} 
            className="w-32 px-3 py-2 border border-slate-900 rounded-md text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
          </select>

          <select className="w-36 px-3 py-2 border border-slate-900 rounded-md text-sm bg-white">
            <option>Assigned To</option>
          </select>

          <Button variant="outline" className="border-slate-900 bg-slate-900 text-white hover:bg-slate-800">
            <Search className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="text-center py-8">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found matching your criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-slate-800 text-white">Client Name</TableHead>
                <TableHead className="bg-slate-800 text-white">Contact</TableHead>
                <TableHead className="bg-slate-800 text-white">Status</TableHead>
                <TableHead className="bg-slate-800 text-white">Active Cases</TableHead>
                <TableHead className="bg-slate-800 text-white">Assigned Lawyer</TableHead>
                <TableHead className="bg-slate-800 text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link to={`/clients/${client.id}`} className="text-gray-900 hover:text-primary transition-colors">
                      {client.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{client.email || '-'}</div>
                    <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'} rounded-full text-xs`}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{client.active_case_count} Cases</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {client.assigned_lawyer_name && (
                        <>
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {client.assigned_lawyer_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm">{client.assigned_lawyer_name}</span>
                        </>
                      )}
                      {!client.assigned_lawyer_name && <span className="text-sm text-gray-500">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to={`/clients/${client.id}`}>
                        <Button variant="outline" size="sm" className="text-white hover:text-white border-slate-900 bg-slate-800 hover:bg-slate-700">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
          onOpenChange={open => !open && setEditingClient(null)} 
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
          onOpenChange={open => !open && setViewingClient(null)} 
        />
      )}
    </div>
  );
};
