import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TimeUtils from '@/lib/timeUtils';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
interface InvoicesTabProps {
  caseId: string;
}
interface LineItem {
  name: string;
  description: string;
  rate: number;
  quantity: number;
}
export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  caseId
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    date: TimeUtils.formatDateInput(TimeUtils.nowDate()),
    due_date: TimeUtils.formatDateInput(TimeUtils.addDaysIST(TimeUtils.nowDate(), 30)),
    payment_terms_label: 'Net 30',
    notes: '',
    line_items: [] as LineItem[]
  });
  const [isClientAutoSelected, setIsClientAutoSelected] = useState(false);

  // Helpers for matching client to Zoho contact
  const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const findMatchingContact = (contacts: any[], clientName?: string, clientEmail?: string, clientPhone?: string) => {
    const nClient = normalize(clientName);
    
    // 1) Exact email match (highest priority)
    if (clientEmail) {
      const lowerEmail = clientEmail.toLowerCase();
      const byEmail = contacts.find((c: any) => 
        c.email?.toLowerCase() === lowerEmail || 
        (Array.isArray(c.contact_persons) && c.contact_persons.some((p: any) => p.email?.toLowerCase() === lowerEmail))
      );
      if (byEmail) return byEmail;
    }
    
    // 2) Phone match (normalize to digits only)
    if (clientPhone) {
      const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '');
      const clientPhoneNorm = normalizePhone(clientPhone);
      if (clientPhoneNorm.length >= 10) {
        const byPhone = contacts.find((c: any) => {
          const contactPhone = normalizePhone(c.phone || c.mobile);
          return contactPhone.includes(clientPhoneNorm.slice(-10)) || 
                 clientPhoneNorm.includes(contactPhone.slice(-10));
        });
        if (byPhone) return byPhone;
      }
    }
    
    // 3) Flexible name/company matching
    const byName = contacts.find((c: any) => {
      const names = [c.contact_name, c.company_name, c.first_name, c.last_name].filter(Boolean);
      return names.some((n: string) => {
        const nn = normalize(n);
        // Check if either contains the other, or if words match
        if (nn === nClient || nn.includes(nClient) || nClient.includes(nn)) {
          return true;
        }
        // Word-based matching (split by space, check overlapping words)
        const clientWords = clientName?.toLowerCase().split(/\s+/).filter(w => w.length > 2) || [];
        const nameWords = n.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const matchingWords = clientWords.filter(cw => nameWords.some(nw => nw.includes(cw) || cw.includes(nw)));
        return matchingWords.length >= Math.min(clientWords.length, nameWords.length, 2);
      });
    });
    if (byName) return byName;
    
    return null;
  };

  // Fetch case details to get client info
  const {
    data: caseData
  } = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('*, clients(id, full_name, email, phone)').eq('id', caseId).single();
      if (error) throw error;
      return data;
    }
  });
  const {
    data: invoices,
    isLoading
  } = useQuery({
    queryKey: ['zoho-case-invoices', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-invoices');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch invoices');

      // Filter invoices that have this case ID in reference_number or notes
      const allInvoices = data.invoices || [];
      return allInvoices.filter((inv: any) => inv.reference_number?.includes(caseId) || inv.notes?.includes(caseId) || inv.custom_fields?.some((cf: any) => cf.value === caseId));
    }
  });
  const {
    data: zohoContacts
  } = useQuery({
    queryKey: ['zoho-contacts-for-invoice'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-get-contacts');
      if (error) return [];
      return data?.contacts || [];
    },
    enabled: createDialogOpen
  });

  // Auto-select client when dialog opens and contacts are loaded
  React.useEffect(() => {
    if (createDialogOpen && zohoContacts && caseData?.clients?.full_name && !isClientAutoSelected) {
      const match = findMatchingContact(
        zohoContacts as any[], 
        caseData?.clients?.full_name, 
        caseData?.clients?.email,
        caseData?.clients?.phone
      );
      if (match) {
        setNewInvoice(prev => ({
          ...prev,
          customer_id: match.contact_id
        }));
        setIsClientAutoSelected(true);
      }
    }
  }, [createDialogOpen, zohoContacts, caseData?.clients?.full_name, caseData?.clients?.email, caseData?.clients?.phone, isClientAutoSelected]);
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-create-invoice', {
        body: invoiceData
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create invoice');
      return data.invoice;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice created and linked to case'
      });
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ['zoho-case-invoices', caseId]
      });
      setNewInvoice({
        customer_id: '',
        date: TimeUtils.formatDateInput(TimeUtils.nowDate()),
        due_date: TimeUtils.formatDateInput(TimeUtils.addDaysIST(TimeUtils.nowDate(), 30)),
        payment_terms_label: 'Net 30',
        notes: '',
        line_items: []
      });
      setIsClientAutoSelected(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  const addLineItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      line_items: [...prev.line_items, {
        name: '',
        description: '',
        rate: 0,
        quantity: 1
      }]
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
      line_items: prev.line_items.map((item, i) => i === index ? {
        ...item,
        [field]: value
      } : item)
    }));
  };
  const handleCreateInvoice = () => {
    if (!newInvoice.customer_id || newInvoice.line_items.length === 0) {
      toast({
        title: 'Missing info',
        description: !newInvoice.customer_id
          ? 'Please select a customer from the dropdown'
          : 'Please add at least one line item',
        variant: 'destructive'
      });
      return;
    }

    // Add case and client info to the invoice
    const invoiceData = {
      ...newInvoice,
      reference_number: `Case: ${caseData?.case_number || caseId}`,
      notes: `${newInvoice.notes}\n\nLinked to Case: ${caseData?.case_number || caseId}\nClient: ${caseData?.clients?.full_name || ''}`.trim()
    };
    createInvoiceMutation.mutate(invoiceData);
  };
  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  const totalAmount = invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0;
  const paidAmount = invoices?.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0;
  const pendingAmount = totalAmount - paidAmount;
  return <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Case Invoices</h3>
        </div>
        <Button onClick={() => {
        setCreateDialogOpen(true);
        setIsClientAutoSelected(false);
      }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-2xl font-semibold">₹{totalAmount.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">₹{paidAmount.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-semibold text-orange-600">₹{pendingAmount.toFixed(2)}</p>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Showing invoices linked to this case
      </div>

      {invoices && invoices.length > 0 ? <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold">Invoice #</th>
                  <th className="text-left p-3 text-sm font-semibold">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold">Date</th>
                  <th className="text-left p-3 text-sm font-semibold">Due Date</th>
                  <th className="text-right p-3 text-sm font-semibold">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-center p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: any) => <tr key={invoice.invoice_id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm">{invoice.customer_name || '-'}</td>
                    <td className="p-3 text-sm">{TimeUtils.formatDate(invoice.date, 'dd/MM/yyyy')} (IST)</td>
                    <td className="p-3 text-sm">{TimeUtils.formatDate(invoice.due_date, 'dd/MM/yyyy')} (IST)</td>
                    <td className="p-3 text-sm text-right font-medium">₹{Number(invoice.total || 0).toFixed(2)}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'error' : 'default'}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </Card> : <div className="text-center py-12 text-muted-foreground">
          <p>No invoices generated for this case</p>
        </div>}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              {newInvoice.customer_id 
                ? 'Customer auto-selected from case client. Review and add line items.'
                : 'Select a customer manually (auto-match failed).'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Display Case and Client Info */}
            <div className="p-4 rounded-lg space-y-2 bg-sky-100">
              <div>
                <Label className="text-xs text-muted-foreground">Case</Label>
                <p className="text-sm font-medium">{caseData?.case_title || 'Loading...'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Client</Label>
                <p className="text-sm font-medium">{caseData?.clients?.full_name || 'Loading...'}</p>
              </div>
            </div>

            {/* Customer Selector (manual fallback) */}
            <div>
              <Label>Zoho Customer *</Label>
              <Select 
                value={newInvoice.customer_id} 
                onValueChange={(value) => setNewInvoice(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger className={!newInvoice.customer_id ? 'border-orange-500' : ''}>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {zohoContacts?.map((contact: any) => (
                    <SelectItem key={contact.contact_id} value={contact.contact_id}>
                      {contact.contact_name || contact.company_name} 
                      {contact.email && ` (${contact.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!newInvoice.customer_id && (
                <p className="text-xs text-orange-600 mt-1">
                  Auto-link failed. Please select manually.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Date</Label>
                <Input type="date" value={newInvoice.date} onChange={e => setNewInvoice(prev => ({
                ...prev,
                date: e.target.value
              }))} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice(prev => ({
                ...prev,
                due_date: e.target.value
              }))} />
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
                {newInvoice.line_items.map((item, index) => <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Item name" value={item.name} onChange={e => updateLineItem(index, 'name', e.target.value)} />
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateLineItem(index, 'quantity', parseFloat(e.target.value))} />
                        <Input type="number" placeholder="Rate" value={item.rate} onChange={e => updateLineItem(index, 'rate', parseFloat(e.target.value))} />
                        <div className="flex items-center justify-center font-semibold">
                          ₹{(item.quantity * item.rate).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>)}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Invoice notes..." value={newInvoice.notes} onChange={e => setNewInvoice(prev => ({
              ...prev,
              notes: e.target.value
            }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};