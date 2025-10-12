import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, Search, Plus, RefreshCw, Eye, Trash2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface FilterState {
  searchQuery: string;
  status: string;
}

interface ZohoInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  currency_code: string;
}

interface ZohoContact {
  contact_id: string;
  contact_name: string;
  company_name: string;
  email: string;
}

interface LineItem {
  name: string;
  description: string;
  rate: number;
  quantity: number;
}

const Invoices: React.FC = () => {
  const { firmId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ZohoInvoice | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
  });

  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    payment_terms_label: 'Net 30',
    notes: '',
    terms: '',
    line_items: [] as LineItem[],
  });

  // Check if Zoho is connected
  const { data: zohoToken, refetch: refetchZohoToken } = useQuery({
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

  // Handle Zoho callback redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const zohoStatus = params.get('zoho');
    
    if (zohoStatus === 'success') {
      refetchZohoToken();
      toast({ 
        title: 'Success', 
        description: 'Zoho Books connected successfully!' 
      });
      navigate('/invoices', { replace: true });
    } else if (zohoStatus === 'error') {
      const message = params.get('message') || 'Failed to connect Zoho';
      toast({ 
        title: 'Error', 
        description: message,
        variant: 'destructive'
      });
      navigate('/invoices', { replace: true });
    }
  }, [location.search, refetchZohoToken, navigate, toast]);

  // Fetch Zoho invoices
  const { data: zohoInvoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['zoho-invoices', zohoToken?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('zoho-books-invoices');
      
      if (error) {
        console.error('Error fetching Zoho invoices:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch invoices');
      }
      
      return data.invoices || [];
    },
    enabled: !!zohoToken,
  });

  // Fetch Zoho contacts for invoice creation
  const { data: zohoContacts } = useQuery({
    queryKey: ['zoho-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('zoho-books-get-contacts');
      
      if (error) {
        console.error('Error fetching Zoho contacts:', error);
        return [];
      }
      
      return data?.contacts || [];
    },
    enabled: !!zohoToken && createDialogOpen,
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const { data, error } = await supabase.functions.invoke('zoho-books-create-invoice', {
        body: invoiceData
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create invoice');
      
      return data.invoice;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Invoice created successfully!' });
      setCreateDialogOpen(false);
      refetchInvoices();
      resetNewInvoice();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('zoho-books-delete-invoice', {
        body: { invoice_id: invoiceId }
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to delete invoice');
      
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Invoice deleted successfully!' });
      refetchInvoices();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetNewInvoice = () => {
    setNewInvoice({
      customer_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      payment_terms_label: 'Net 30',
      notes: '',
      terms: '',
      line_items: [],
    });
  };

  const addLineItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      line_items: [...prev.line_items, { name: '', description: '', rate: 0, quantity: 1 }]
    }));
  };

  const removeLineItem = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.customer_id || newInvoice.line_items.length === 0) {
      toast({ title: 'Error', description: 'Please select a customer and add line items', variant: 'destructive' });
      return;
    }

    createInvoiceMutation.mutate(newInvoice);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleConnectZoho = () => {
    const zohoClientId = '1000.MC4YZPCGPZGGJ2J7BTJQZLURRPME6Z';
    const redirectUri = 'https://crm.hrulegal.com/zoho/callback';
    const scope = 'ZohoBooks.invoices.READ,ZohoBooks.invoices.CREATE,ZohoBooks.invoices.UPDATE,ZohoBooks.invoices.DELETE,ZohoBooks.contacts.READ';
    
    const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=${encodeURIComponent(scope)}&client_id=${zohoClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  };

  // Filter invoices
  const filteredInvoices = zohoInvoices?.filter((invoice: ZohoInvoice) => {
    const matchesSearch = filters.searchQuery === '' || 
      invoice.invoice_number.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(filters.searchQuery.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || invoice.status.toLowerCase() === filters.status.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const stats = {
    outstanding: filteredInvoices.reduce((sum: number, inv: ZohoInvoice) => 
      inv.status !== 'paid' ? sum + inv.balance : sum, 0),
    overdue: filteredInvoices.reduce((sum: number, inv: ZohoInvoice) => 
      inv.status === 'overdue' ? sum + inv.balance : sum, 0),
    paid: filteredInvoices.reduce((sum: number, inv: ZohoInvoice) => 
      inv.status === 'paid' ? sum + inv.total : sum, 0),
    draftCount: filteredInvoices.filter((inv: ZohoInvoice) => inv.status === 'draft').length,
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-600',
    };

    return (
      <Badge className={`${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'} capitalize`}>
        {status}
      </Badge>
    );
  };

  if (!zohoToken) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Connect Zoho Books</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Zoho Books account to create and manage invoices
          </p>
          <Button onClick={handleConnectZoho} size="lg">
            Connect Zoho Books
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">Manage your Zoho Books invoices</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Connected to Zoho Books</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
          <p className="text-2xl font-semibold text-blue-600">₹{stats.outstanding.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">₹{stats.overdue.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">₹{stats.paid.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Draft</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.draftCount}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="Search invoices..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={() => refetchInvoices()}>
          <RefreshCw className="w-4 h-4" />
        </Button>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Invoices Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice: ZohoInvoice) => (
                <TableRow key={invoice.invoice_id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">₹{invoice.total.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">₹{invoice.balance.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteInvoice(invoice.invoice_id)}
                        disabled={deleteInvoiceMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer *</Label>
                <Select 
                  value={newInvoice.customer_id} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, customer_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {zohoContacts?.map((contact: ZohoContact) => (
                      <SelectItem key={contact.contact_id} value={contact.contact_id}>
                        {contact.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Terms</Label>
                <Select 
                  value={newInvoice.payment_terms_label} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, payment_terms_label: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Date</Label>
                <Input 
                  type="date" 
                  value={newInvoice.date}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input 
                  type="date" 
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {newInvoice.line_items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input 
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                      />
                      <Input 
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input 
                          type="number"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                        />
                        <Input 
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value))}
                        />
                        <div className="flex items-center justify-center font-semibold">
                          ₹{(item.quantity * item.rate).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeLineItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                placeholder="Add notes..."
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div>
              <Label>Terms & Conditions</Label>
              <Textarea 
                placeholder="Add terms and conditions..."
                value={newInvoice.terms}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, terms: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInvoice} 
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.date), 'dd MMM yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-semibold">₹{selectedInvoice.total.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-xl font-semibold text-red-600">₹{selectedInvoice.balance.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;