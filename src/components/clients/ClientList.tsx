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
  const {
    toast
  } = useToast();
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
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data as Client[];
    }
  });
  const handleDeleteClient = async (clientId: string) => {
    try {
      const {
        error
      } = await supabase.from('clients').delete().eq('id', clientId);
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
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            
            <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
            <span className="text-sm text-gray-500">{filteredClients.length} Total</span>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="text-white bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-gray-300 bg-zinc-50" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white min-w-[120px]">
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white min-w-[140px]">
              <option>Assigned To</option>
            </select>
            <Button variant="outline" className="text-sm border-slate-900 bg-slate-50 text-slate-900">
              <Search className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? <div className="text-center py-12">
              <div className="text-gray-500">Loading clients...</div>
            </div> : filteredClients.length === 0 ? <div className="text-center py-12">
              <div className="text-gray-500">
                No clients found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first client to get started.'}
              </div>
            </div> : <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-white bg-slate-800">Client Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-white">Contact</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-white">Assigned Lawyer</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-white">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-white">Active Cases</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map(client => <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link to={`/clients/${client.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                          {client.full_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{client.email || '-'}</div>
                        <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {client.assigned_lawyer_name && <>
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {client.assigned_lawyer_name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900">{client.assigned_lawyer_name}</span>
                            </>}
                          {!client.assigned_lawyer_name && <span className="text-sm text-gray-500">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className={client.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{client.active_case_count} Cases</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </div>
      </div>

      {/* Dialogs */}
      <AddClientDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => {
      refetch();
      setShowAddDialog(false);
    }} />

      {editingClient && <EditClientDialog client={editingClient} open={!!editingClient} onOpenChange={open => !open && setEditingClient(null)} onSuccess={() => {
      refetch();
      setEditingClient(null);
    }} />}

      {viewingClient && <ClientDetailsDialog client={viewingClient} open={!!viewingClient} onOpenChange={open => !open && setViewingClient(null)} />}
    </div>;
};