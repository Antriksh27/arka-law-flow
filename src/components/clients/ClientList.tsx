import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Eye, Upload, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    role
  } = useAuth();
  const {
    data: queryResult,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients', searchTerm, statusFilter, page, sortField, sortDirection],
    queryFn: async () => {
      console.log('Fetching clients...');
      try {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;

        // Map sort field to database column
        const dbSortField = sortField === 'name' ? 'full_name' : 
                           sortField === 'active_cases' ? 'active_case_count' : 
                           sortField;

        // First try to get from client_stats view with pagination and sorting
        let {
          data,
          error,
          count
        } = await supabase.from('client_stats').select('*', {
          count: 'exact'
        }).order(dbSortField, {
          ascending: sortDirection === 'asc'
        }).range(startIndex, endIndex);
        if (error) {
          console.log('client_stats view failed, trying clients table:', error);
          // Fallback to clients table with pagination and sorting
          const result = await supabase.from('clients').select('*', {
            count: 'exact'
          }).order(dbSortField === 'active_case_count' ? 'created_at' : dbSortField, {
            ascending: sortDirection === 'asc'
          }).range(startIndex, endIndex);
          if (result.error) throw result.error;

          // Transform to match expected interface
          data = result.data?.map(client => ({
            ...client,
            active_case_count: 0
          })) || [];
          count = result.count;
        }

        // Apply client-side filters after pagination
        let filteredData = data || [];
        if (searchTerm) {
          filteredData = filteredData.filter(client => client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (statusFilter !== 'all') {
          filteredData = filteredData.filter(client => client.status === statusFilter);
        }
        console.log('Fetched clients:', filteredData);
        return {
          clients: filteredData as Client[],
          totalCount: count || 0
        };
      } catch (err) {
        console.error('Error fetching clients:', err);
        throw err;
      }
    }
  });
  const clients = queryResult?.clients || [];
  const totalCount = queryResult?.totalCount || 0;
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpDown className="w-3 h-3 rotate-180" /> : 
      <ArrowUpDown className="w-3 h-3" />;
  };
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
  const handleClientNameClick = (clientId: string) => {
    if (role === 'office_staff') {
      navigate(`/staff/clients/${clientId}`);
    } else {
      navigate(`/clients/${clientId}`);
    }
  };
  console.log('ClientList render state:', {
    isLoading,
    error,
    clientsCount: clients.length
  });
  if (error) {
    console.error('ClientList error:', error);
    return <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error loading clients: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>;
  }
  return <div className="space-y-6">
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
            <Input placeholder="Search clients by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-slate-900" />
          </div>

          

          

          

          
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {isLoading ? <div className="text-center py-8">Loading clients...</div> : clients.length === 0 ? <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No clients found matching your criteria.</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-slate-800 hover:bg-slate-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Client
            </Button>
          </div> : <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-slate-800 text-white">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                    Client Name
                    <SortIcon field="name" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">
                  <button onClick={() => handleSort('email')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                    Contact
                    <SortIcon field="email" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">
                  <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                    Status
                    <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">
                  <button onClick={() => handleSort('active_cases')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                    Active Cases
                    <SortIcon field="active_cases" />
                  </button>
                </TableHead>
                <TableHead className="bg-slate-800 text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => <TableRow key={client.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <button onClick={() => handleClientNameClick(client.id)} className="text-gray-900 hover:text-blue-600 hover:underline text-left font-medium cursor-pointer">
                      {client.full_name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{client.email || '-'}</div>
                    <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : client.status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'} rounded-full text-xs`}>
                      {client.status === 'new' ? 'New' : client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{client.active_case_count || 0} Cases</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-white hover:text-white border-slate-900 bg-slate-800 hover:bg-slate-700" onClick={() => setViewingClient(client)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>}
        
        {/* Pagination */}
        {!isLoading && Math.ceil(totalCount / pageSize) > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(totalCount / pageSize)} (Total: {totalCount} clients)
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="hidden sm:flex">
                First
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({
              length: Math.min(Math.ceil(totalCount / pageSize), 5)
            }, (_, i) => {
              const totalPages = Math.ceil(totalCount / pageSize);
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return <Button key={pageNum} variant={page === pageNum ? "default" : "ghost"} size="sm" onClick={() => setPage(pageNum)} className="min-w-[32px]">
                      {pageNum}
                    </Button>;
            })}
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === Math.ceil(totalCount / pageSize)}>
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.ceil(totalCount / pageSize))} disabled={page === Math.ceil(totalCount / pageSize)} className="hidden sm:flex">
                Last
              </Button>
            </div>
          </div>}
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

      <BulkImportClientsDialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog} onSuccess={() => {
      refetch();
      setShowBulkImportDialog(false);
    }} />
    </div>;
};