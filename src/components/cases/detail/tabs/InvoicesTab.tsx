import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { InvoiceStatusBadge } from '@/features/invoices/components/InvoiceStatusBadge';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoicesTabProps {
  caseId: string;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ caseId }) => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['case-invoices', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(full_name)')
        .eq('case_id', caseId)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="p-6">Loading invoices...</div>;
  }

  const totalAmount = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
  const paidAmount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-2xl font-semibold">₹{totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">₹{paidAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-semibold text-orange-600">₹{pendingAmount.toFixed(2)}</p>
        </div>
      </div>

      {invoices && invoices.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Invoice #</th>
                <th className="text-left p-3 text-sm font-semibold">Client</th>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-left p-3 text-sm font-semibold">Due Date</th>
                <th className="text-right p-3 text-sm font-semibold">Amount</th>
                <th className="text-left p-3 text-sm font-semibold">Status</th>
                <th className="text-center p-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                  <td className="p-3 text-sm">{invoice.clients?.full_name || '-'}</td>
                  <td className="p-3 text-sm">{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</td>
                  <td className="p-3 text-sm">{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</td>
                  <td className="p-3 text-sm text-right font-medium">₹{Number(invoice.total_amount || 0).toFixed(2)}</td>
                  <td className="p-3 text-sm">
                    <InvoiceStatusBadge status={invoice.status} />
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
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No invoices generated for this case</p>
        </div>
      )}
    </div>
  );
};
