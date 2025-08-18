import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Download, Mail, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import type { InvoiceStatus } from '../types';

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  onEdit?: () => void;
}

export const InvoiceViewDialog: React.FC<InvoiceViewDialogProps> = ({
  open,
  onOpenChange,
  invoiceId,
  onEdit,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch invoice data
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-details', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(full_name, email, phone, address),
          case:cases(case_title),
          invoice_items(
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

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: InvoiceStatus) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-details', invoiceId] });
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Invoice ${invoice?.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-header { text-align: center; margin-bottom: 30px; }
              .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .invoice-table th { background-color: #f5f5f5; }
              .text-right { text-align: right; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading invoice...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-red-500">Invoice not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoice_number}</span>
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={invoice.status} />
              <Select
                value={invoice.status}
                onValueChange={(value: InvoiceStatus) => updateStatusMutation.mutate(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="py-4">
          {/* Invoice Header */}
          <div className="invoice-header text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-lg text-gray-600 mt-2">#{invoice.invoice_number}</p>
          </div>

          {/* Invoice Details */}
          <div className="invoice-details grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
              <div className="text-gray-700">
                <p className="font-medium">{invoice.client?.full_name}</p>
                {invoice.client?.email && <p>{invoice.client.email}</p>}
                {invoice.client?.phone && <p>{invoice.client.phone}</p>}
                {invoice.client?.address && <p className="mt-2 whitespace-pre-line">{invoice.client.address}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-4">
                {invoice.title && <p className="text-lg font-semibold">{invoice.title}</p>}
                {invoice.case?.case_title && <p className="text-gray-600">Case: {invoice.case.case_title}</p>}
              </div>
              <div className="space-y-1">
                <p><span className="font-medium">Issue Date:</span> {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
                <p><span className="font-medium">Due Date:</span> {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <table className="invoice-table w-full border-collapse mb-8">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left bg-gray-50">Description</th>
                <th className="border border-gray-300 px-4 py-3 text-center bg-gray-50">Quantity</th>
                <th className="border border-gray-300 px-4 py-3 text-right bg-gray-50">Rate (₹)</th>
                <th className="border border-gray-300 px-4 py-3 text-right bg-gray-50">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items?.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-3">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    {Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right font-bold bg-gray-50">
                  Total Amount:
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold bg-gray-50">
                  ₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Notes:</h3>
              <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm mt-12">
            <p>Thank you for your business!</p>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {invoice.client?.email && (
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email Invoice
            </Button>
          )}
          {onEdit && (
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Invoice
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};