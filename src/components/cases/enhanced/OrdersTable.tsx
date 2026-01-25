import { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Eye, Download, ChevronLeft, ChevronRight, X, Files, Scale } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Order {
  id: string;
  order_number?: string | null;
  judge?: string | null;
  hearing_date?: string | null;
  order_date?: string | null;
  pdf_base64?: string | null;
  order_link?: string | null;
}

interface OrdersTableProps {
  orders: Order[];
}

// Single PDF viewer modal
const PDFViewerModal = ({ 
  base64Data, 
  fileName, 
  isOpen, 
  onClose 
}: { base64Data: string; fileName: string; isOpen: boolean; onClose: () => void }) => {
  const pdfUrl = useMemo(() => {
    if (!base64Data) return null;
    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting base64 to PDF:', error);
      return null;
    }
  }, [base64Data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] p-0 m-0">
        <DialogHeader className="p-4 pb-0 border-b bg-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{fileName}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 h-[calc(100vh-60px)]">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full" title={fileName} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Unable to load PDF
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// All Orders Viewer Modal with next/previous navigation
const AllOrdersViewerModal = ({
  orders,
  isOpen,
  onClose,
  initialIndex = 0,
}: {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Filter orders that have PDFs
  const ordersWithPdf = useMemo(
    () => orders.filter((o) => o.pdf_base64),
    [orders]
  );

  const currentOrder = ordersWithPdf[currentIndex];

  const pdfUrl = useMemo(() => {
    if (!currentOrder?.pdf_base64) return null;
    try {
      const binary = atob(currentOrder.pdf_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting base64 to PDF:', error);
      return null;
    }
  }, [currentOrder]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(ordersWithPdf.length - 1, prev + 1));
  }, [ordersWithPdf.length]);

  // Reset index when modal opens
  useMemo(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  if (ordersWithPdf.length === 0) return null;

  const orderName = currentOrder?.order_number || `Order ${currentIndex + 1}`;
  const orderDate = currentOrder?.hearing_date || currentOrder?.order_date;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] p-0 m-0">
        <DialogHeader className="p-4 pb-0 border-b bg-background">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center min-w-[200px]">
                <DialogTitle className="text-lg font-semibold">
                  {orderName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {orderDate ? format(new Date(orderDate), 'dd/MM/yyyy') : 'No date'} • {currentIndex + 1} of {ordersWithPdf.length}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                disabled={currentIndex === ordersWithPdf.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 h-[calc(100vh-80px)]">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full" title={orderName} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Unable to load PDF
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const OrdersTable = ({ orders }: OrdersTableProps) => {
  const [selectedPdf, setSelectedPdf] = useState<{ data: string; name: string } | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const ordersWithPdf = useMemo(() => orders.filter((o) => o.pdf_base64), [orders]);

  const handleDownloadAll = useCallback(async () => {
    if (ordersWithPdf.length === 0) {
      toast({
        title: 'No PDFs available',
        description: 'There are no orders with PDF files to download.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Downloading...',
      description: `Downloading ${ordersWithPdf.length} order(s)`,
    });

    ordersWithPdf.forEach((order, idx) => {
      if (order.pdf_base64) {
        const linkSource = `data:application/pdf;base64,${order.pdf_base64}`;
        const downloadLink = document.createElement('a');
        downloadLink.href = linkSource;
        downloadLink.download = `Order_${order.order_number || idx + 1}.pdf`;
        downloadLink.click();
      }
    });
  }, [ordersWithPdf, toast]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Scale className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">No orders found</p>
        <p className="text-xs text-slate-500 mt-1">Court orders will appear here</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <>
        {/* Mobile Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => setViewAllOpen(true)}
            disabled={ordersWithPdf.length === 0}
            className="flex-1 h-10 text-xs rounded-full"
          >
            <Files className="h-4 w-4 mr-1.5" />
            View All ({ordersWithPdf.length})
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            disabled={ordersWithPdf.length === 0}
            className="flex-1 h-10 text-xs rounded-full"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download All
          </Button>
        </div>

        {/* Mobile Order Cards */}
        <div className="space-y-3">
          {orders.map((order, idx) => (
            <div key={order.id} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {order.order_number || `Order ${idx + 1}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.hearing_date 
                        ? format(new Date(order.hearing_date), 'dd MMM yyyy')
                        : 'No Date'}
                    </p>
                  </div>
                </div>
              </div>
              
              {order.judge && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500">Judge: {order.judge}</p>
                </div>
              )}
              
              {order.pdf_base64 && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedPdf({
                        data: order.pdf_base64!,
                        name: `Order_${order.order_number || idx + 1}.pdf`,
                      })
                    }
                    className="flex-1 h-9 text-xs rounded-full"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
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
                    className="flex-1 h-9 text-xs rounded-full"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* PDF Viewers */}
        {selectedPdf && (
          <PDFViewerModal
            base64Data={selectedPdf.data}
            fileName={selectedPdf.name}
            isOpen={!!selectedPdf}
            onClose={() => setSelectedPdf(null)}
          />
        )}
        <AllOrdersViewerModal
          orders={orders}
          isOpen={viewAllOpen}
          onClose={() => setViewAllOpen(false)}
        />
      </>
    );
  }

  // Desktop Table View
  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          onClick={() => setViewAllOpen(true)}
          disabled={ordersWithPdf.length === 0}
          className="flex items-center gap-2"
        >
          <Files className="h-4 w-4" />
          View All Orders ({ordersWithPdf.length})
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadAll}
          disabled={ordersWithPdf.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download All Orders
        </Button>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Order No</TableHead>
              <TableHead className="font-semibold text-slate-700">Judge</TableHead>
              <TableHead className="font-semibold text-slate-700">Judgment Date</TableHead>
              <TableHead className="font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, idx) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-slate-900">
                  {order.order_number || `Order ${idx + 1}`}
                </TableCell>
                <TableCell className="text-slate-700">
                  {order.judge || 'N/A'}
                </TableCell>
                <TableCell className="text-slate-700">
                  {order.hearing_date
                    ? format(new Date(order.hearing_date), 'dd/MM/yyyy')
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {order.pdf_base64 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedPdf({
                            data: order.pdf_base64!,
                            name: `Order_${order.order_number || idx + 1}.pdf`,
                          })
                        }
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
                    <span className="text-sm text-slate-500">No PDF</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Single PDF Viewer */}
      {selectedPdf && (
        <PDFViewerModal
          base64Data={selectedPdf.data}
          fileName={selectedPdf.name}
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
        />
      )}

      {/* All Orders Viewer with Navigation */}
      <AllOrdersViewerModal
        orders={orders}
        isOpen={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
      />
    </>
  );
};
