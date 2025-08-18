import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvoicesHeader } from '@/features/invoices/components/InvoicesHeader';
import { InvoicesTable } from '@/features/invoices/components/InvoicesTable';
import { InvoiceFormDialog } from '@/features/invoices/components/InvoiceFormDialog';
import { InvoiceViewDialog } from '@/features/invoices/components/InvoiceViewDialog';
import { DeleteInvoiceDialog } from '@/features/invoices/components/DeleteInvoiceDialog';
import { useInvoiceStats } from '@/features/invoices/hooks/useInvoiceStats';
import type { InvoiceListData } from '@/features/invoices/types';
import { Loader2, AlertCircle, Search, Plus, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
const fetchInvoices = async (firmId: string | undefined): Promise<InvoiceListData[]> => {
  if (!firmId) {
    throw new Error('Firm ID is required to fetch invoices.');
  }
  const {
    data,
    error
  } = await supabase.from('invoices').select(`
      *,
      client:clients(full_name),
      case:cases(title)
    `).eq('firm_id', firmId).order('created_at', {
    ascending: false
  });
  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message);
  }
  return data as InvoiceListData[];
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
const InvoiceToolbar = ({
  total = 0,
  onNewInvoice
}: {
  total: number;
  onNewInvoice: () => void;
}) => {
  return <div className="flex w-full flex-wrap items-center gap-4 mb-2">
      <div className="flex grow shrink-0 basis-0 items-center gap-3">
        {/* Make search styling match hearings -- bg-white, border, text-base */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input className="max-w-xs pl-10 bg-white rounded-lg border border-gray-200 text-base focus:ring-2 focus:ring-primary outline-none" placeholder="Search invoices..." />
        </div>
        <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800">
          Status
        </Button>
        <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800">
          Date Range
        </Button>
        <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800">
          Case
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="icon" className="border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800">
          <Download className="w-4 h-4" />
          <span className="sr-only">Download as CSV</span>
        </Button>
        <Button variant="secondary" size="icon" className="border-gray-200 text-slate-50 bg-slate-900 hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button className="text-white px-4 bg-slate-900 hover:bg-slate-800" onClick={onNewInvoice}>
          <Plus className="w-4 h-4 mr-1" />
          New Invoice
        </Button>
      </div>
    </div>;
};
const Breadcrumbs = () => <nav className="mb-4 flex items-center space-x-3 text-sm text-muted-foreground" aria-label="Breadcrumb">
    <span className="font-medium">Arka</span>
    <span className="mx-1">/</span>
    
  </nav>;
const Invoices: React.FC = () => {
  const {
    firmId,
    loading,
    firmError
  } = useAuth();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  const {
    data: invoices,
    isLoading,
    error
  } = useQuery({
    queryKey: ['invoices', firmId],
    queryFn: () => fetchInvoices(firmId),
    enabled: !!firmId
  });
  return <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      {/* Header */}
      <div className="flex w-full flex-wrap items-center gap-4">
        <div className="flex grow shrink-0 basis-0 items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <Badge variant="default">{invoices ? `${invoices.length} total` : "--"}</Badge>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white px-4" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>
      {/* Stats Row (cards) */}
      <InvoiceStats firmId={firmId} />
      {/* Filters/Search Bar */}
      <InvoiceToolbar total={invoices?.length || 0} onNewInvoice={() => setCreateDialogOpen(true)} />
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