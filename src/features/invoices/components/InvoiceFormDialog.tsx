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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceFormData } from '../types';

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
  
  const [formData, setFormData] = useState<{
    title: string;
    client_id: string;
    case_id: string;
    issue_date: Date;
    due_date: Date;
    notes: string;
    items: InvoiceItem[];
  }>({
    title: '',
    client_id: '',
    case_id: '',
    issue_date: new Date(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
  });

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

        <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Invoice Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Legal Services Invoice"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
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
                      : "Select a client..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white z-[60]">
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
                              const value = client.id;
                              setFormData(prev => ({ 
                                ...prev, 
                                client_id: value,
                                case_id: '' // Reset case when client changes
                              }));
                              // Auto-populate case if client has only one case
                              if (cases) {
                                const clientCases = cases.filter(case_ => case_.client_id === value);
                                if (clientCases.length === 1) {
                                  setTimeout(() => {
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      case_id: clientCases[0].id 
                                    }));
                                  }, 100);
                                }
                              }
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="case">Case (Optional)</Label>
              <Select
                value={formData.case_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, case_id: value }))}
                disabled={!formData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases?.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id}>
                      {case_.case_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Issue Date *</Label>
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

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.due_date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, due_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Invoice Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label htmlFor={`desc-${index}`}>Description</Label>
                    <Input
                      id={`desc-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Service description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`qty-${index}`}>Quantity</Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`rate-${index}`}>Rate (₹)</Label>
                    <Input
                      id={`rate-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      value={(item.quantity * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <Label className="text-lg font-semibold">
                  Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or terms"
              rows={3}
            />
          </div>
        </div>

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