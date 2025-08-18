import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceFormData, FlatFeeItem, ExpenseItem, AdjustmentItem } from '../types';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
}

export const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onOpenChange,
  invoiceId,
}) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    title: '',
    client_id: '',
    case_id: '',
    issue_date: new Date(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    kind_attention: '',
    client_address: '',
    secondary_client_name: '',
    secondary_client_address: '',
    gstin: '',
    state_code: '',
    invoice_subject: '',
    description: '',
    signature_name: '',
    tax_rate: 18,
  });

  const [flatFees, setFlatFees] = useState<FlatFeeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>([]);

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['clients', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('firm_id', firmId)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!firmId && open,
  });

  // Fetch cases for dropdown - filtered by selected client
  const { data: cases } = useQuery({
    queryKey: ['cases', firmId, formData.client_id],
    queryFn: async () => {
      let query = supabase
        .from('cases')
        .select('id, case_title, client_id')
        .eq('firm_id', firmId);
      
      // Filter by client if selected
      if (formData.client_id) {
        query = query.eq('client_id', formData.client_id);
      }
      
      const { data, error } = await query.order('case_title');
      if (error) throw error;
      return data;
    },
    enabled: !!firmId && open,
  });

  // Fetch invoice data for editing
  const { data: invoiceData } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            id,
            description,
            quantity,
            rate,
            amount
          )
        `)
        .eq('id', invoiceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId && open,
  });

  // Populate form when editing
  useEffect(() => {
    if (invoiceData) {
      setFormData({
        title: invoiceData.title || '',
        client_id: invoiceData.client_id,
        case_id: invoiceData.case_id || '',
        issue_date: new Date(invoiceData.issue_date),
        due_date: new Date(invoiceData.due_date),
        notes: invoiceData.notes || '',
        items: invoiceData.invoice_items?.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })) || [{ description: '', quantity: 1, rate: 0 }],
      });
    }
  }, [invoiceData]);

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

      if (invoiceId) {
        // Update existing invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            title: data.title,
            client_id: data.client_id,
            case_id: data.case_id || null,
            issue_date: format(data.issue_date, 'yyyy-MM-dd'),
            due_date: format(data.due_date, 'yyyy-MM-dd'),
            notes: data.notes,
            total_amount: totalAmount,
          })
          .eq('id', invoiceId);

        if (invoiceError) throw invoiceError;

        // Delete existing items and recreate
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
        
        const itemsToInsert = data.items.map(item => ({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      } else {
        // Generate invoice number
        const year = new Date().getFullYear();
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('firm_id', firmId!)
          .like('invoice_number', `INV-${year}-%`)
          .order('created_at', { ascending: false })
          .limit(1);

        let nextNumber = 1;
        if (lastInvoice && lastInvoice.length > 0) {
          const lastNumber = parseInt(lastInvoice[0].invoice_number.split('-')[2]) || 0;
          nextNumber = lastNumber + 1;
        }

        const invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;

        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            title: data.title,
            client_id: data.client_id,
            case_id: data.case_id || null,
            issue_date: format(data.issue_date, 'yyyy-MM-dd'),
            due_date: format(data.due_date, 'yyyy-MM-dd'),
            notes: data.notes,
            total_amount: totalAmount,
            firm_id: firmId!,
            created_by: user!.id,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        const itemsToInsert = data.items.map(item => ({
          invoice_id: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: `Invoice ${invoiceId ? 'updated' : 'created'} successfully`,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: '',
        client_id: '',
        case_id: '',
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: '',
        items: [{ description: '', quantity: 1, rate: 0 }],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${invoiceId ? 'update' : 'create'} invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Cases are already filtered by the query based on selected client

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoiceId ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Information */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="issue_date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.issue_date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.issue_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, issue_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="client_id">Client Name *</Label>
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className="w-full justify-between"
                    >
                      {formData.client_id
                        ? clients?.find((client) => client.id === formData.client_id)?.full_name
                        : "Select client"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background border z-50">
                    <Command>
                      <CommandInput placeholder="Search clients..." />
                      <CommandList>
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          {clients?.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.full_name}
                              onSelect={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  client_id: client.id,
                                  case_id: ''
                                }));
                                setClientSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.client_id === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="kind_attention">Kind Attention</Label>
                <Input
                  id="kind_attention"
                  value={formData.kind_attention || ''}
                  onChange={(e) => setFormData({ ...formData, kind_attention: e.target.value })}
                  placeholder="Kind attention to..."
                />
              </div>

              <div>
                <Label htmlFor="client_address">Client Address</Label>
                <Textarea
                  id="client_address"
                  value={formData.client_address || ''}
                  onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                  placeholder="Client address"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin || ''}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="GST Identification Number"
                />
              </div>

              <div>
                <Label htmlFor="state_code">State Code</Label>
                <Select 
                  value={formData.state_code || ''} 
                  onValueChange={(value) => setFormData({ ...formData, state_code: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state code" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="24">24-GUJARAT</SelectItem>
                    <SelectItem value="27">27-MAHARASHTRA</SelectItem>
                    <SelectItem value="07">07-DELHI</SelectItem>
                    <SelectItem value="09">09-UTTAR PRADESH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="case_id">Case</Label>
                <Select 
                  value={formData.case_id || ''} 
                  onValueChange={(value) => setFormData({ ...formData, case_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {cases?.map((case_item) => (
                      <SelectItem key={case_item.id} value={case_item.id}>
                        {case_item.case_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-full">
                <Label htmlFor="invoice_subject">Invoice Subject</Label>
                <Input
                  id="invoice_subject"
                  value={formData.invoice_subject || ''}
                  onChange={(e) => setFormData({ ...formData, invoice_subject: e.target.value })}
                  placeholder="Invoice subject"
                />
              </div>

              <div className="col-span-full">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Invoice description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="signature_name">Signature Name</Label>
                <Input
                  id="signature_name"
                  value={formData.signature_name || ''}
                  onChange={(e) => setFormData({ ...formData, signature_name: e.target.value })}
                  placeholder="Authorized signatory name"
                />
              </div>

              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={formData.tax_rate || 0}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="18.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for the invoice"
              rows={4}
            />
          </CardContent>
        </Card>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => createUpdateMutation.mutate(formData)}
            disabled={!formData.client_id || formData.items.some(item => !item.description) || createUpdateMutation.isPending}
          >
            {createUpdateMutation.isPending ? 'Saving...' : (invoiceId ? 'Update Invoice' : 'Create Invoice')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};