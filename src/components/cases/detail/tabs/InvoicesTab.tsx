import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ caseId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    payment_terms_label: 'Net 30',
    notes: '',
    line_items: [] as LineItem[],
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['zoho-case-invoices', caseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('zoho-books-invoices');
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch invoices');
      
      return data.invoices || [];
    }
  });

  const { data: zohoContacts } = useQuery({
    queryKey: ['zoho-contacts-for-invoice'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('zoho-books-get-contacts');
      
      if (error) return [];
      return data?.contacts || [];
    },
    enabled: createDialogOpen,
  });

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
      queryClient.invalidateQueries({ queryKey: ['zoho-case-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-invoices'] });
      setNewInvoice({
        customer_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        payment_terms_label: 'Net 30',
        notes: '',
        line_items: [],
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

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
      toast({ title: 'Error', description: 'Please select customer and add line items', variant: 'destructive' });
      return;
    }

    createInvoiceMutation.mutate(newInvoice);
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const totalAmount = invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0;
  const paidAmount = invoices?.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0;
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Case Invoices</h3>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
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

      {invoices && invoices.length > 0 ? (
        <Card>
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
                {invoices.map((invoice: any) => (
                  <tr key={invoice.invoice_id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm">{invoice.customer_name || '-'}</td>
                    <td className="p-3 text-sm">{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                    <td className="p-3 text-sm">{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No invoices generated for this case</p>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                  {zohoContacts?.map((contact: any) => (
                    <SelectItem key={contact.contact_id} value={contact.contact_id}>
                      {contact.contact_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      <div className="grid grid-cols-3 gap-2">
                        <Input 
                          type="number"
                          placeholder="Qty"
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
                placeholder="Invoice notes..."
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
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
    </div>
  );
};