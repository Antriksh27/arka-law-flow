import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gavel, AlertCircle, Eye, Download, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IframeViewer from '@/components/documents/IframeViewer';

interface LegalkartOrdersTableProps {
  caseId: string;
}

interface OrderData {
  id: string;
  judge: string;
  hearing_date: string;
  order_number: string;
  bench: string;
  order_details: string;
  pdf_base64?: string;
  order_link?: string;
}

const fetchOrders = async (caseId: string): Promise<OrderData[]> => {
  try {
    const { fetchLegalkartCaseId } = await import('./utils');
    const lkCaseId = await fetchLegalkartCaseId(caseId);
    if (!lkCaseId) return [];

    const { data, error } = await (supabase as any)
      .from('legalkart_case_orders')
      .select('*')
      .eq('legalkart_case_id', lkCaseId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

export const LegalkartOrdersTable: React.FC<LegalkartOrdersTableProps> = ({ caseId }) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');

  const { data: orders, isLoading } = useQuery<OrderData[]>({
    queryKey: ['legalkart-orders', caseId],
    queryFn: () => fetchOrders(caseId),
    enabled: !!caseId
  });

  const convertBase64ToBlobUrl = (base64: string): string => {
    try {
      // Strip UTF-8 BOM prefix if present (77u/ in base64)
      let cleanBase64 = base64;
      if (base64.startsWith('77u/')) {
        cleanBase64 = base64.substring(4);
      }
      
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting base64:', error);
      return '';
    }
  };

  const handleView = (order: OrderData) => {
    if (order.pdf_base64) {
      const blobUrl = convertBase64ToBlobUrl(order.pdf_base64);
      setViewerUrl(blobUrl);
      setViewerTitle(order.order_number || 'Order');
      setViewerOpen(true);
    } else if (order.order_link) {
      setViewerUrl(order.order_link);
      setViewerTitle(order.order_number || 'Order');
      setViewerOpen(true);
    }
  };

  const handleDownload = (order: OrderData) => {
    if (order.pdf_base64) {
      const blobUrl = convertBase64ToBlobUrl(order.pdf_base64);
      window.open(blobUrl, '_blank');
    } else if (order.order_link) {
      window.open(order.order_link, '_blank');
    }
  };

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
        <Gavel className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No orders found for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.judge || '-'}</TableCell>
                <TableCell>{formatDate(order.hearing_date)}</TableCell>
                <TableCell className="font-mono text-sm">{order.order_number || '-'}</TableCell>
                <TableCell>{order.bench || '-'}</TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm leading-relaxed">
                    {order.order_details || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  {(order.pdf_base64 || order.order_link) && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleView(order)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(order)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <IframeViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={viewerTitle}
        url={viewerUrl}
      />
    </div>
  );
};