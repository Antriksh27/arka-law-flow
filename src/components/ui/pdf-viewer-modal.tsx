import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerModalProps {
  base64Data: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFViewerModal = ({ 
  base64Data, 
  fileName, 
  isOpen, 
  onClose 
}: PDFViewerModalProps) => {
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
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={fileName}
            />
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
