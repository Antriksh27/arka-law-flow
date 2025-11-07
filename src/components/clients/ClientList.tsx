import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Eye, Upload, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2, Filter, SlidersHorizontal, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddClientDialog } from './AddClientDialog';
import { EditClientDialog } from './EditClientDialog';
import { ClientDetailsDialog } from './ClientDetailsDialog';
import { BulkImportClientsDialog } from './BulkImportClientsDialog';
import { SyncClientsToZoho } from './SyncClientsToZoho';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'lead' | 'new';
  organization?: string;
  active_case_count: number;
  created_at: string;
  is_vip?: boolean;
  computed_status?: 'active' | 'inactive' | 'lead';
}
type StatusFilter = 'all' | 'active' | 'inactive' | 'lead' | 'new';
type SortField = 'name' | 'status' | 'created_at' | 'active_cases' | 'email';
type SortDirection = 'asc' | 'desc';
type TabFilter = 'all' | 'vip';
export const ClientList = () => {
  console.log('ClientList component rendering...');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [vipToggleClient, setVipToggleClient] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
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
    queryKey: ['clients', searchTerm, statusFilter, page, sortField, sortDirection, activeTab],
    queryFn: async () => {
      console.log('Fetching clients...');
      try {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;

        // Map sort field to database column
        const dbSortField = sortField === 'name' ? 'full_name' : sortField === 'active_cases' ? 'active_case_count' : sortField;

        let data: any[] = [];
        let count = 0;


        // Fetch clients with their case statuses to compute dynamic status
        let clientsQuery = supabase
          .from('clients')
          .select('*', { count: 'exact' });
        
        // Apply VIP filter if on VIP tab
        if (activeTab === 'vip') {
          clientsQuery = clientsQuery.eq('is_vip', true);
        }
        
        const clientsResult = await clientsQuery
          .order(dbSortField === 'active_case_count' ? 'created_at' : dbSortField, {
            ascending: sortDirection === 'asc'
          })
          .range(startIndex, endIndex);

        if (clientsResult.error) throw clientsResult.error;

        const baseClients = clientsResult.data || [];
        count = clientsResult.count || 0;

        // Fetch case statuses for these clients
        if (baseClients.length > 0) {
          const clientIds = baseClients.map(c => c.id);
          const { data: casesData } = await supabase
            .from('cases')
            .select('client_id, status')
            .in('client_id', clientIds);

          // Compute status based on cases
          data = baseClients.map(client => {
            const clientCases = casesData?.filter(c => c.client_id === client.id) || [];
            const activeCases = clientCases.filter(c => c.status === 'open').length;
            const disposedCases = clientCases.filter(c => c.status === 'closed' || c.status === 'disposed').length;
            
            let computed_status: 'lead' | 'active' | 'inactive' = 'lead';
            
            if (clientCases.length === 0) {
              computed_status = 'lead';
            } else if (activeCases > 0) {
              computed_status = 'active';
            } else if (disposedCases > 0) {
              computed_status = 'inactive';
            }

            return {
              ...client,
              active_case_count: activeCases,
              computed_status
            };
          });
        } else {
          data = [];
        }

        if (activeTab === 'all') {
          // Already computed above
        }

        // Apply client-side filters
        let filteredData = data || [];
        
        if (searchTerm) {
          filteredData = filteredData.filter(client => client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        if (statusFilter !== 'all') {
          filteredData = filteredData.filter(client => client.computed_status === statusFilter);
        }
        console.log('Fetched clients:', filteredData);
        return {
          clients: filteredData as Client[],
          totalCount: count || 0,
          filteredCount: filteredData.length
        };
      } catch (err) {
        console.error('Error fetching clients:', err);
        throw err;
      }
    }
  });
  const clients = queryResult?.clients || [];
  const totalCount = queryResult?.totalCount || 0;
  const filteredCount = queryResult?.filteredCount || 0;
  const displayCount = (searchTerm || statusFilter !== 'all') ? filteredCount : totalCount;
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting
  };
  const SortIcon = ({
    field
  }: {
    field: SortField;
  }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDirection === 'asc' ? <ArrowUpDown className="w-3 h-3 rotate-180" /> : <ArrowUpDown className="w-3 h-3" />;
  };
  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    
    try {
      const {
        error
      } = await supabase.from('clients').delete().eq('id', deletingClient.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
      setDeletingClient(null);
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

  const handleToggleVIP = async (clientId: string, currentVipStatus: boolean, clientName: string) => {
    // If removing VIP status, ask for confirmation
    if (currentVipStatus) {
      setVipToggleClient({ id: clientId, name: clientName, currentStatus: currentVipStatus });
      return;
    }

    // If marking as VIP, do it immediately
    await performVIPToggle(clientId, currentVipStatus);
  };

  const performVIPToggle = async (clientId: string, currentVipStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_vip: !currentVipStatus })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Client ${!currentVipStatus ? 'marked as VIP ⭐' : 'removed from VIP'}`,
      });
      
      // Refetch to ensure UI is updated
      await refetch();
    } catch (error) {
      console.error('Error toggling VIP status:', error);
      toast({
        title: "Error",
        description: "Failed to update VIP status",
        variant: "destructive",
      });
    }
  };

  const confirmVIPRemoval = async () => {
    if (!vipToggleClient) return;
    await performVIPToggle(vipToggleClient.id, vipToggleClient.currentStatus);
    setVipToggleClient(null);
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white rounded-2xl shadow-sm border border-gray-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            All Clients
          </TabsTrigger>
          <TabsTrigger value="vip" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white flex items-center gap-2">
            <Star className="w-4 h-4 fill-current" />
            VIP Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search clients by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-slate-900" />
          </div>

          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-50">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-accent' : ''}
              >
                All Clients
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-accent' : ''}
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('new')}
                className={statusFilter === 'new' ? 'bg-accent' : ''}
              >
                New
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('lead')}
                className={statusFilter === 'lead' ? 'bg-accent' : ''}
              >
                Lead
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('inactive')}
                className={statusFilter === 'inactive' ? 'bg-accent' : ''}
              >
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Sort: {sortField === 'name' ? 'Name' : sortField === 'active_cases' ? 'Cases' : sortField.charAt(0).toUpperCase() + sortField.slice(1)}
                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-50">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleSort('name')}
                className={sortField === 'name' ? 'bg-accent' : ''}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSort('email')}
                className={sortField === 'email' ? 'bg-accent' : ''}
              >
                Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSort('status')}
                className={sortField === 'status' ? 'bg-accent' : ''}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSort('active_cases')}
                className={sortField === 'active_cases' ? 'bg-accent' : ''}
              >
                Active Cases {sortField === 'active_cases' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSort('created_at')}
                className={sortField === 'created_at' ? 'bg-accent' : ''}
              >
                Date Added {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleClientNameClick(client.id)} className="text-gray-900 hover:text-blue-600 hover:underline text-left font-medium cursor-pointer">
                        {client.full_name}
                      </button>
                      {client.is_vip && (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-label="VIP Client" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{client.email || '-'}</div>
                    <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${client.computed_status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : client.computed_status === 'lead' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'} rounded-full text-xs`}>
                      {client.computed_status === 'lead' ? 'Lead' : client.computed_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{client.active_case_count || 0} Cases</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVIP(client.id, client.is_vip || false, client.full_name);
                        }}
                        className={client.is_vip ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"}
                        title={client.is_vip ? "Remove VIP status" : "Mark as VIP"}
                      >
                        <Star className={client.is_vip ? "w-4 h-4 fill-yellow-400" : "w-4 h-4"} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewingClient(client)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeletingClient(client)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>}
        
        {/* Pagination */}
        {!isLoading && Math.ceil(displayCount / pageSize) > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(displayCount / pageSize)} (
              {searchTerm || statusFilter !== 'all' ? `Filtered: ${displayCount} of ${totalCount}` : `Total: ${totalCount}`} clients)
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
              length: Math.min(Math.ceil(displayCount / pageSize), 5)
            }, (_, i) => {
              const totalPages = Math.ceil(displayCount / pageSize);
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
              
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === Math.ceil(displayCount / pageSize)}>
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.ceil(displayCount / pageSize))} disabled={page === Math.ceil(displayCount / pageSize)} className="hidden sm:flex">
                Last
              </Button>
            </div>
          </div>}
          </div>
        </TabsContent>

        <TabsContent value="vip" className="mt-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search VIP clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-slate-900" />
              </div>

              {/* Status Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter('all')}
                    className={statusFilter === 'all' ? 'bg-accent' : ''}
                  >
                    All VIP Clients
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter('active')}
                    className={statusFilter === 'active' ? 'bg-accent' : ''}
                  >
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter('new')}
                    className={statusFilter === 'new' ? 'bg-accent' : ''}
                  >
                    New
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter('lead')}
                    className={statusFilter === 'lead' ? 'bg-accent' : ''}
                  >
                    Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter('inactive')}
                    className={statusFilter === 'inactive' ? 'bg-accent' : ''}
                  >
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Sort: {sortField === 'name' ? 'Name' : sortField === 'active_cases' ? 'Cases' : sortField.charAt(0).toUpperCase() + sortField.slice(1)}
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleSort('name')}
                    className={sortField === 'name' ? 'bg-accent' : ''}
                  >
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('email')}
                    className={sortField === 'email' ? 'bg-accent' : ''}
                  >
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('status')}
                    className={sortField === 'status' ? 'bg-accent' : ''}
                  >
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('active_cases')}
                    className={sortField === 'active_cases' ? 'bg-accent' : ''}
                  >
                    Active Cases {sortField === 'active_cases' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('created_at')}
                    className={sortField === 'created_at' ? 'bg-accent' : ''}
                  >
                    Date Added {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* VIP Clients Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {isLoading ? <div className="text-center py-8">Loading VIP clients...</div> : clients.length === 0 ? <div className="text-center py-12">
                <Star className="w-12 h-12 mx-auto mb-4 text-yellow-400 fill-yellow-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No VIP clients yet</h3>
                <p className="text-gray-500 mb-4">Mark important clients as VIP to see them here.</p>
              </div> : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-yellow-600 text-white">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                        Client Name
                        <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead className="bg-yellow-600 text-white">
                      <button onClick={() => handleSort('email')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                        Contact
                        <SortIcon field="email" />
                      </button>
                    </TableHead>
                    <TableHead className="bg-yellow-600 text-white">
                      <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                        Status
                        <SortIcon field="status" />
                      </button>
                    </TableHead>
                    <TableHead className="bg-yellow-600 text-white">
                      <button onClick={() => handleSort('active_cases')} className="flex items-center gap-1 hover:text-gray-200 font-semibold">
                        Active Cases
                        <SortIcon field="active_cases" />
                      </button>
                    </TableHead>
                    <TableHead className="bg-yellow-600 text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => <TableRow key={client.id} className="hover:bg-yellow-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleClientNameClick(client.id)} className="text-gray-900 hover:text-blue-600 hover:underline text-left font-medium cursor-pointer">
                            {client.full_name}
                          </button>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-label="VIP Client" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{client.email || '-'}</div>
                        <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${client.computed_status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : client.computed_status === 'lead' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'} rounded-full text-xs`}>
                          {client.computed_status === 'lead' ? 'Lead' : client.computed_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{client.active_case_count || 0} Cases</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVIP(client.id, client.is_vip || false, client.full_name);
                            }}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            title="Remove VIP status"
                          >
                            <Star className="w-4 h-4 fill-yellow-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewingClient(client)}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDeletingClient(client)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>}
            
            {/* Pagination */}
            {!isLoading && Math.ceil(displayCount / pageSize) > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(displayCount / pageSize)} (
                  {searchTerm || statusFilter !== 'all' ? `Filtered: ${displayCount} of ${totalCount}` : `Total: ${totalCount}`} VIP clients)
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
                  length: Math.min(Math.ceil(displayCount / pageSize), 5)
                }, (_, i) => {
                  const totalPages = Math.ceil(displayCount / pageSize);
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
                  
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === Math.ceil(displayCount / pageSize)}>
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.ceil(displayCount / pageSize))} disabled={page === Math.ceil(displayCount / pageSize)} className="hidden sm:flex">
                    Last
                  </Button>
                </div>
              </div>}
          </div>
        </TabsContent>
      </Tabs>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingClient?.full_name}</span>? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* VIP Removal Confirmation Dialog */}
      <AlertDialog open={!!vipToggleClient} onOpenChange={(open) => !open && setVipToggleClient(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove VIP Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove VIP status from <span className="font-semibold">{vipToggleClient?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVIPRemoval} className="bg-yellow-600 hover:bg-yellow-700">
              Remove VIP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};