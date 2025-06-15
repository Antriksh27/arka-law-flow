
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt } from 'lucide-react';

interface ClientBillingProps {
  clientId: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
};

export const ClientBilling: React.FC<ClientBillingProps> = ({ clientId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, title, issue_date, due_date, total_amount, status')
        .eq('client_id', clientId)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading invoices...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-gray-500 py-8">
            <Receipt className="w-8 h-8 mb-2" />
            <span>Unable to load billing details.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-8 h-8 mx-auto mb-2" />
            No invoices found for this client.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Billing & Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Invoice #</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Issue Date</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Due Date</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.title || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">₹{Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusColors[inv.status] || 'bg-gray-100 text-gray-700 border-gray-200'} rounded-full text-xs px-2`}>
                      {inv.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
