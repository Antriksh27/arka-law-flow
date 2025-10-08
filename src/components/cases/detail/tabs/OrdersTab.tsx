import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, Eye } from 'lucide-react';
import { openBase64PdfInNewTab } from '@/lib/partyParser';
import { format } from 'date-fns';

interface OrdersTabProps {
  caseId: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ caseId }) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['case-orders', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_orders' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No orders found for this case</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order Title</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {order.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{order.order_title || order.title || 'Court Order'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {order.order_description || order.description || 'No description'}
                </td>
                <td className="py-3 px-4 text-right">
                  {order.pdf_base64 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBase64PdfInNewTab(order.pdf_base64)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Order
                    </Button>
                  ) : order.order_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(order.order_url, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400">No file</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
