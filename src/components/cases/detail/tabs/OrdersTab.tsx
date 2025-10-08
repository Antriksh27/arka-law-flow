import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, Gavel, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { openBase64PdfInNewTab } from '@/lib/partyParser';
import { toast } from 'sonner';
import { fetchLegalkartCaseId } from '../../legalkart/utils';

interface OrdersTabProps {
  caseId: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ caseId }) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['case-orders-api', caseId],
    queryFn: async () => {
      const lkCaseId = await fetchLegalkartCaseId(caseId);
      if (!lkCaseId) return [];

      const { data, error } = await supabase
        .from('legalkart_orders' as any)
        .select('*')
        .eq('legalkart_case_id', lkCaseId)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const handleViewPdf = (pdfBase64: string, filename: string) => {
    try {
      openBase64PdfInNewTab(pdfBase64, filename);
    } catch (error) {
      toast.error('Failed to open PDF document');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-[#6B7280]">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Gavel className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
        <p className="text-[#6B7280]">No orders available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#F9FAFB]">
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <Gavel className="w-5 h-5 text-[#1E3A8A] mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {order.order_details || 'Order'}
                      </p>
                      {order.order_text && (
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                          {order.order_text}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#6B7280]">
                  {order.order_date ? (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(order.order_date), 'MMM dd, yyyy')}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4">
                  {order.pdf_base64 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPdf(order.pdf_base64, `order_${order.order_date}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View PDF
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
