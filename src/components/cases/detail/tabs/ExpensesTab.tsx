import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ExpensesTabProps {
  caseId: string;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ caseId }) => {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['case-expenses', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*, invoices!inner(case_id, invoice_number, issue_date, status)')
        .eq('invoices.case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="p-6">Loading expenses...</div>;
  }

  const totalExpenses = expenses?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Case Expenses</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-semibold">₹{totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {expenses && expenses.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Description</th>
                <th className="text-left p-3 text-sm font-semibold">Invoice #</th>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-right p-3 text-sm font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{item.description}</td>
                  <td className="p-3 text-sm">{item.invoices?.invoice_number}</td>
                  <td className="p-3 text-sm">
                    {item.invoices?.issue_date ? format(new Date(item.invoices.issue_date), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="p-3 text-sm text-right font-medium">₹{Number(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No expenses recorded for this case</p>
        </div>
      )}
    </div>
  );
};
