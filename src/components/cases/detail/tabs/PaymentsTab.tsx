import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PaymentsTabProps {
  caseId: string;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ caseId }) => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['case-payments', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, issue_date, total_amount, status, clients(full_name)')
        .eq('case_id', caseId)
        .eq('status', 'paid')
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="p-6">Loading payments...</div>;
  }

  const totalPaid = payments?.reduce((sum, payment) => sum + Number(payment.total_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payments Received</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Received</p>
          <p className="text-2xl font-semibold text-green-600">₹{totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {payments && payments.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Invoice #</th>
                <th className="text-left p-3 text-sm font-semibold">Client</th>
                <th className="text-left p-3 text-sm font-semibold">Payment Date</th>
                <th className="text-right p-3 text-sm font-semibold">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{payment.invoice_number}</td>
                  <td className="p-3 text-sm">{payment.clients?.full_name || '-'}</td>
                  <td className="p-3 text-sm">{format(new Date(payment.issue_date), 'dd/MM/yyyy')}</td>
                  <td className="p-3 text-sm text-right font-medium text-green-600">
                    ₹{Number(payment.total_amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No payments received for this case</p>
        </div>
      )}
    </div>
  );
};
