import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gavel, AlertCircle } from 'lucide-react';

interface LegalkartOrdersTableProps {
  caseId: string;
}

export const LegalkartOrdersTable: React.FC<LegalkartOrdersTableProps> = ({ caseId }) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['legalkart-orders', caseId],
    queryFn: async (): Promise<any[]> => {
      try {
        const { data: legalkartCase } = await supabase
          .from('legalkart_cases')
          .select('id')
          .eq('case_id', caseId)
          .single();
        
        if (!legalkartCase) return [];
        
        const { data, error } = await supabase
          .from('legalkart_case_orders')
          .select('*')
          .eq('case_id', legalkartCase.id) as any;
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!caseId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Gavel className="mx-auto h-8 w-8 text-muted mb-2" />
        <p className="text-muted">No orders found for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        <AlertCircle className="w-4 h-4" />
        <span>{orders.length} order(s) found</span>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judge</TableHead>
              <TableHead>Hearing Date</TableHead>
              <TableHead>Order Number</TableHead>
              <TableHead>Bench</TableHead>
              <TableHead>Order Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.judge || '-'}</TableCell>
                <TableCell>
                  {order.hearing_date 
                    ? new Date(order.hearing_date).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                <TableCell className="font-mono text-sm">{order.order_number || '-'}</TableCell>
                <TableCell>{order.bench || '-'}</TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm leading-relaxed">
                    {order.order_details || '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};