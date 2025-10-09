import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Eye, Download } from 'lucide-react';
import { PDFViewerModal } from '@/components/ui/pdf-viewer-modal';

interface OrdersTableProps {
  orders: any[];
}

export const OrdersTable = ({ orders }: OrdersTableProps) => {
  const [selectedPdf, setSelectedPdf] = useState<{ data: string; name: string } | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <div className="text-base">No orders found</div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB]">
              <TableHead className="font-semibold">Order No</TableHead>
              <TableHead className="font-semibold">Judge</TableHead>
              <TableHead className="font-semibold">Judgment Date</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, idx) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-[#111827]">
                  {order.order_number || `Order ${idx + 1}`}
                </TableCell>
                <TableCell className="text-[#111827]">
                  {order.judge || 'N/A'}
                </TableCell>
                <TableCell className="text-[#111827]">
                  {order.hearing_date 
                    ? format(new Date(order.hearing_date), 'dd-MM-yyyy')
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {order.pdf_base64 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPdf({
                          data: order.pdf_base64,
                          name: `Order_${order.order_number || idx + 1}.pdf`
                        })}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const linkSource = `data:application/pdf;base64,${order.pdf_base64}`;
                          const downloadLink = document.createElement('a');
                          downloadLink.href = linkSource;
                          downloadLink.download = `Order_${order.order_number || idx + 1}.pdf`;
                          downloadLink.click();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-[#6B7280]">No PDF</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedPdf && (
        <PDFViewerModal
          base64Data={selectedPdf.data}
          fileName={selectedPdf.name}
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
        />
      )}
    </>
  );
};
