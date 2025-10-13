import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Eye, Upload, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddClientDialog } from './AddClientDialog';
import { EditClientDialog } from './EditClientDialog';
import { ClientDetailsDialog } from './ClientDetailsDialog';
import { BulkImportClientsDialog } from './BulkImportClientsDialog';
import { SyncClientsToZoho } from './SyncClientsToZoho';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  organization?: string;
  assigned_lawyer_name?: string;
  active_case_count: number;
  created_at: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
type SortField = 'name' | 'status' | 'created_at' | 'active_cases' | 'email';
type SortDirection = 'asc' | 'desc';

export const ClientList = () => {
  console.log('ClientList component rendering...');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { role } = useAuth();

  const {
    data: rawClients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients', searchTerm, statusFilter],
    queryFn: async () => {
      console.log('Fetching clients...');
      try {
        // First try to get from client_stats view, if that fails, get from clients table
        let { data, error } = await supabase
          .from('client_stats')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.log('client_stats view failed, trying clients table:', error);
          // Fallback to clients table
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (clientError) throw clientError;
          
          // Transform to match expected interface
          data = clientData?.map(client => ({
            ...client,
            active_case_count: 0,
            assigned_lawyer_name: null
          })) || [];
        }

        if (searchTerm) {
          data = data?.filter(client => 
            client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase())
          ) || [];
        }
        
        if (statusFilter !== 'all') {
          data = data?.filter(client => client.status === statusFilter) || [];
        }

        console.log('Fetched clients:', data);
        return data as Client[];
      } catch (err) {
        console.error('Error fetching clients:', err);
        throw err;
      }
    }
  });

  // Sort clients based on current sort field and direction
  const clients = useMemo(() => {
    if (!rawClients.length) return [];
    
    const sorted = [...rawClients].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.full_name?.toLowerCase() || '';
          bValue = b.full_name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'active_cases':
          aValue = a.active_case_count || 0;
          bValue = b.active_case_count || 0;
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [rawClients, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const handleClientNameClick = (clientId: string) => {
    if (role === 'office_staff') {
      navigate(`/staff/clients/${clientId}`);
    } else {
      navigate(`/clients/${clientId}`);
    }
  };

  console.log('ClientList render state:', { isLoading, error, clientsCount: clients.length });

  if (error) {
    console.error('ClientList error:', error);
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error loading clients: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        </div>
        <div className="flex gap-2">
          <SyncClientsToZoho />
          <Button onClick={() => setShowAddDialog(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>
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
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
          </select>

          <select 
            value={`${sortField}-${sortDirection}`} 
            onChange={e => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as SortField);
              setSortDirection(direction as SortDirection);
            }} 
            className="w-48 px-3 py-2 border border-slate-900 rounded-md text-sm bg-white"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="active_cases-desc">Most Cases</option>
            <option value="active_cases-asc">Least Cases</option>
          </select>

          <Button 
            variant="outline" 
            onClick={() => setShowBulkImportDialog(true)}
            className="border-slate-900 text-slate-900 hover:bg-slate-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>

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
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No clients found matching your criteria.</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-slate-800 hover:bg-slate-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Client
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-slate-800 text-white">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-200"
                  >
                    Client Name
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">
                  <button 
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-gray-200"
                  >
                    Contact
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">
                  <button 
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-200"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">
                  <button 
                    onClick={() => handleSort('active_cases')}
                    className="flex items-center gap-1 hover:text-gray-200"
                  >
                    Active Cases
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">Assigned Lawyer</TableHead>
                <TableHead className="bg-slate-800 text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => (
                <TableRow key={client.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <button
                      onClick={() => handleClientNameClick(client.id)}
                      className="text-gray-900 hover:text-blue-600 hover:underline text-left font-medium cursor-pointer"
                    >
                      {client.full_name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{client.email || '-'}</div>
                    <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${
                        client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                        client.status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      } rounded-full text-xs`}
                    >
                      {client.status === 'new' ? 'New' : client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{client.active_case_count || 0} Cases</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {client.assigned_lawyer_name ? (
                        <>
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {client.assigned_lawyer_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm">{client.assigned_lawyer_name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-white hover:text-white border-slate-900 bg-slate-800 hover:bg-slate-700"
                        onClick={() => setViewingClient(client)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
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

      <BulkImportClientsDialog 
        open={showBulkImportDialog} 
        onOpenChange={setShowBulkImportDialog} 
        onSuccess={() => {
          refetch();
          setShowBulkImportDialog(false);
        }} 
      />
    </div>
  );
};
