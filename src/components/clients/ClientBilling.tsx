
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';

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
  const { data: clientData } = useQuery({
    queryKey: ['client-zoho', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('full_name, email')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['zoho-client-invoices', clientId, clientData?.email],
    enabled: !!clientData?.email,
    queryFn: async () => {
      const { data: invoicesData, error } = await supabase.functions.invoke('zoho-books-invoices');
      if (error) throw error;
      
      // Filter invoices by client email
      const clientInvoices = invoicesData?.invoices?.filter((inv: any) => 
        inv.customer_name?.toLowerCase().includes(clientData.full_name.toLowerCase()) ||
        inv.email?.toLowerCase() === clientData.email.toLowerCase()
      ) || [];
      
      return clientInvoices;
    }
  });

  if (!clientData?.email) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-8 h-8 mx-auto mb-2" />
            Client email required to fetch invoices from Zoho Books.
          </div>
        </CardContent>
      </Card>
    );
  }

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
                <tr key={inv.invoice_id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.reference_number || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">{inv.date ? TimeUtils.formatDate(inv.date) : '—'}</td>
                  <td className="px-4 py-3">{inv.due_date ? TimeUtils.formatDate(inv.due_date) : '—'}</td>
                  <td className="px-4 py-3">₹{Number(inv.total).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusColors[inv.status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'} rounded-full text-xs px-2`}>
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
