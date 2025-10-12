import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvoicesHeader } from '@/features/invoices/components/InvoicesHeader';
import { InvoicesTable } from '@/features/invoices/components/InvoicesTable';
import { InvoiceFormDialog } from '@/features/invoices/components/InvoiceFormDialog';
import { InvoiceViewDialog } from '@/features/invoices/components/InvoiceViewDialog';
import { DeleteInvoiceDialog } from '@/features/invoices/components/DeleteInvoiceDialog';
import { useInvoiceStats } from '@/features/invoices/hooks/useInvoiceStats';
import type { InvoiceListData } from '@/features/invoices/types';
import { Loader2, AlertCircle, Search, Plus, Download, RefreshCw, Calendar, FileText, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
interface FilterState {
  searchQuery: string;
  status: string;
  caseId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const fetchInvoices = async (firmId: string | undefined, filters: FilterState): Promise<InvoiceListData[]> => {
  if (!firmId) {
    throw new Error('Firm ID is required to fetch invoices.');
  }
  
  let query = supabase
    .from('invoices')
    .select(`
      *,
      client:clients(full_name),
      case:cases(title)
    `)
    .eq('firm_id', firmId);

  // Apply filters
  if (filters.searchQuery) {
    query = query.or(`invoice_number.ilike.%${filters.searchQuery}%,client.full_name.ilike.%${filters.searchQuery}%`);
  }
  
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled');
  }
  
  if (filters.caseId && filters.caseId !== 'all') {
    query = query.eq('case_id', filters.caseId);
  }
  
  if (filters.dateFrom) {
    query = query.gte('issue_date', format(filters.dateFrom, 'yyyy-MM-dd'));
  }
  
  if (filters.dateTo) {
    query = query.lte('issue_date', format(filters.dateTo, 'yyyy-MM-dd'));
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message);
  }
  return data as InvoiceListData[];
};

const fetchCases = async (firmId: string | undefined) => {
  if (!firmId) return [];
  
  const { data, error } = await supabase
    .from('cases')
    .select('id, title')
    .eq('firm_id', firmId)
    .order('title');
    
  if (error) {
    console.error('Error fetching cases:', error);
    return [];
  }
  return data;
};
const InvoiceStats = ({ firmId }: { firmId: string | undefined }) => {
  const { data: stats, isLoading } = useInvoiceStats(firmId);

  if (isLoading) {
    return <div className="flex w-full flex-wrap items-start gap-4 mobile:flex-col">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-2xl border border-gray-200 px-6 py-6 shadow-sm bg-slate-100 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-8 bg-gray-300 rounded w-16"></div>
        </div>
      ))}
    </div>;
  }

  return <div className="flex w-full flex-wrap items-start gap-4 mobile:flex-col">
      {/* Outstanding */}
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-2xl border border-gray-200 px-6 py-6 shadow-sm hover:shadow-md transition-shadow bg-slate-100">
        <span className="text-sm font-medium text-muted-foreground">Outstanding</span>
        <span className="text-2xl font-semibold text-cyan-500">₹{stats?.outstanding.toLocaleString('en-IN') || '0'}</span>
      </div>
      {/* Overdue */}
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-2xl border border-gray-200 px-6 py-6 shadow-sm hover:shadow-md transition-shadow bg-slate-100">
        <span className="text-sm font-medium text-muted-foreground">Overdue</span>
        <span className="text-2xl font-semibold text-red-600">₹{stats?.overdue.toLocaleString('en-IN') || '0'}</span>
      </div>
      {/* Paid this month */}
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-2xl border border-gray-200 px-6 py-6 shadow-sm hover:shadow-md transition-shadow bg-slate-100">
        <span className="text-sm font-medium text-muted-foreground">Paid this month</span>
        <span className="text-2xl font-semibold text-green-600">₹{stats?.paidThisMonth.toLocaleString('en-IN') || '0'}</span>
      </div>
      {/* Draft */}
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-2xl border border-gray-200 px-6 py-6 shadow-sm hover:shadow-md transition-shadow bg-slate-100">
        <span className="text-sm font-medium text-muted-foreground">Draft</span>
        <span className="text-2xl font-semibold text-yellow-500">{stats?.draftCount || 0}</span>
      </div>
    </div>;
};
interface InvoiceToolbarProps {
  total: number;
  onNewInvoice: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onRefresh: () => void;
  onDownload: () => void;
  cases: Array<{ id: string; title: string }>;
}

const InvoiceToolbar: React.FC<InvoiceToolbarProps> = ({
  total = 0,
  onNewInvoice,
  filters,
  onFiltersChange,
  onRefresh,
  onDownload,
  cases
}) => {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-4 mb-2">
      <div className="flex grow shrink-0 basis-0 items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input 
            className="max-w-xs pl-10 bg-white rounded-lg border border-gray-200 text-base focus:ring-2 focus:ring-primary outline-none" 
            placeholder="Search invoices..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          />
        </div>
        
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
          <SelectTrigger className="w-32 bg-white border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg z-50">
              <CalendarComponent
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => {
                  updateFilters({ dateFrom: date });
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg z-50">
              <CalendarComponent
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => {
                  updateFilters({ dateTo: date });
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Case Filter */}
        <Select value={filters.caseId} onValueChange={(value) => updateFilters({ caseId: value })}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue placeholder="All Cases" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="all">All Cases</SelectItem>
            {cases.map((case_) => (
              <SelectItem key={case_.id} value={case_.id}>
                {case_.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          className="border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800"
          onClick={onDownload}
        >
          <Download className="w-4 h-4" />
          <span className="sr-only">Download as CSV</span>
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800"
          onClick={onRefresh}
        >
          <RefreshCw className="w-4 h-4" />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button className="text-white px-4 bg-slate-900 hover:bg-slate-800" onClick={onNewInvoice}>
          <Plus className="w-4 h-4 mr-1" />
          New Invoice
        </Button>
      </div>
    </div>
  );
};
const Breadcrumbs = () => <nav className="mb-4 flex items-center space-x-3 text-sm text-muted-foreground" aria-label="Breadcrumb">
    <span className="font-medium">Arka</span>
    <span className="mx-1">/</span>
    
  </nav>;
const Invoices: React.FC = () => {
  const { firmId, loading, firmError } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [organizationId, setOrganizationId] = useState('');
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    caseId: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });

  // Check if Zoho is connected
  const { data: zohoToken } = useQuery({
    queryKey: ['zoho-token', firmId],
    queryFn: async () => {
      if (!firmId) return null;
      const { data, error } = await supabase
        .from('zoho_tokens')
        .select('*')
        .eq('firm_id', firmId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching Zoho token:', error);
        return null;
      }
      return data;
    },
    enabled: !!firmId
  });

  const handleConnectZoho = () => {
    const zohoClientId = '1000.MC4YZPCGPZGGJ2J7BTJQZLURRPME6Z';
    const redirectUri = 'https://crm.hrulegal.com/zoho/callback';
    const scope = 'ZohoInvoice.invoices.ALL';
    
    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${zohoClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline`;
    
    // Open in new tab to avoid iframe restrictions
    window.open(authUrl, '_blank');
    toast({ 
      title: 'Opening Zoho Authorization', 
      description: 'Complete the authorization in the new tab, then refresh this page.' 
    });
  };

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', firmId, filters],
    queryFn: () => fetchInvoices(firmId, filters),
    enabled: !!firmId
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases', firmId],
    queryFn: () => fetchCases(firmId),
    enabled: !!firmId
  });

  const { data: zohoInvoices, isLoading: isLoadingZohoInvoices } = useQuery({
    queryKey: ['zoho-invoices', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase.functions.invoke('zoho-books-invoices', {
        body: { organization_id: organizationId }
      });
      
      if (error) {
        console.error('Error fetching Zoho invoices:', error);
        toast({ title: 'Error', description: 'Failed to fetch Zoho invoices', variant: 'destructive' });
        return null;
      }
      
      return data;
    },
    enabled: !!zohoToken && !!organizationId,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices', firmId] });
    toast({ title: 'Refreshed', description: 'Invoice data has been refreshed.' });
  };

  const handleDownload = () => {
    if (!invoices || invoices.length === 0) {
      toast({ title: 'No data', description: 'No invoices to download.', variant: 'destructive' });
      return;
    }

    // Create CSV content
    const headers = ['Invoice Number', 'Client', 'Case', 'Issue Date', 'Due Date', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...invoices.map(invoice => [
        invoice.invoice_number,
        invoice.client?.full_name || 'N/A',
        invoice.case?.title || 'N/A',
        invoice.issue_date || 'N/A',
        invoice.due_date || 'N/A',
        invoice.total_amount || 0,
        invoice.status
      ].join(','))
    ].join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Downloaded', description: 'Invoice data has been downloaded as CSV.' });
  };
  return <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      {/* Header */}
      <div className="flex w-full flex-wrap items-center gap-4">
        <div className="flex grow shrink-0 basis-0 items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <Badge variant="default">{invoices ? `${invoices.length} total` : "--"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {!zohoToken ? (
            <Button 
              variant="outline" 
              className="border-blue-500 text-blue-600 hover:bg-blue-50" 
              onClick={handleConnectZoho}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Connect Zoho
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700">Zoho Connected</span>
            </div>
          )}
          <Button className="bg-primary hover:bg-primary/90 text-white px-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>
      {/* Stats Row (cards) */}
      <InvoiceStats firmId={firmId} />
      {/* Zoho Organization ID Input */}
      {zohoToken && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="org-id" className="block text-sm font-medium mb-2">
                Zoho Organization ID
              </label>
              <Input
                id="org-id"
                type="text"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="Enter your Zoho Books Organization ID"
                className="w-full"
              />
            </div>
            {organizationId && (
              <div className="text-sm text-muted-foreground pt-6">
                {isLoadingZohoInvoices ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <span>{zohoInvoices?.invoices?.length || 0} Zoho invoices found</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoho Invoices Table */}
      {zohoInvoices?.invoices && zohoInvoices.invoices.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted">
            <h3 className="text-lg font-semibold">Zoho Books Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold">Invoice #</th>
                  <th className="text-left p-3 text-sm font-semibold">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold">Date</th>
                  <th className="text-right p-3 text-sm font-semibold">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {zohoInvoices.invoices.map((invoice: any) => (
                  <tr key={invoice.invoice_id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm">{invoice.customer_name}</td>
                    <td className="p-3 text-sm">{invoice.date}</td>
                    <td className="p-3 text-sm text-right font-medium">
                      {invoice.currency_symbol}{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-sm">
                      <Badge variant={invoice.status === 'paid' ? 'success' : 'outline'}>
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Filters/Search Bar */}
      <InvoiceToolbar 
        total={invoices?.length || 0} 
        onNewInvoice={() => setCreateDialogOpen(true)}
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        cases={cases}
      />
      {/* Table / Loading / Error */}
      {(isLoading || loading) && <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading invoices...</span>
      </div>}
      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Failed to load invoices: {error.message}
            </p>
          </div>
        </div>
      </div>}
      {!isLoading && !loading && !error && invoices && <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-0 mt-2">
        <InvoicesTable 
          invoices={invoices} 
          isLoading={isLoading}
          onView={(id) => {
            setSelectedInvoiceId(id);
            setViewDialogOpen(true);
          }}
          onEdit={(id) => {
            setSelectedInvoiceId(id);
            setEditDialogOpen(true);
          }}
          onDelete={(id) => {
            setSelectedInvoiceId(id);
            setDeleteDialogOpen(true);
          }}
        />
      </div>}
      {!isLoading && !loading && !error && (!invoices || invoices.length === 0) && firmId && <div className="text-center py-12">
        <p className="text-gray-500">No invoices found for this firm.</p>
      </div>}
      {!isLoading && !loading && !firmId && <div className="text-center py-12">
        <p className="text-gray-500">Firm information not available. Cannot load invoices.</p>
        {firmError && <p className="mt-2 text-red-400 text-sm">{firmError}</p>}
      </div>}

      {/* Dialogs */}
      <InvoiceFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <InvoiceFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        invoiceId={selectedInvoiceId}
      />
      <InvoiceViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        invoiceId={selectedInvoiceId}
        onEdit={() => {
          setViewDialogOpen(false);
          setEditDialogOpen(true);
        }}
      />
      <DeleteInvoiceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        invoiceId={selectedInvoiceId}
        invoiceNumber={invoices?.find(inv => inv.id === selectedInvoiceId)?.invoice_number}
      />
    </div>;
};
export default Invoices;