import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface PDFViewerEnhancedProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  url: string | null;
}

export const PDFViewerEnhanced: React.FC<PDFViewerEnhancedProps> = ({ 
  open, 
  onClose, 
  title = 'Document Viewer', 
  url 
}) => {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  const handleOpenNew = () => {
    if (url) window.open(url, '_blank');
  };

  const handleDownload = () => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = title || 'document.pdf';
      link.click();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={!url || zoom <= 50}
                  className="h-7 w-7 p-0"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={resetZoom}
                  disabled={!url}
                  className="h-7 px-2 text-xs"
                >
                  {zoom}%
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={!url || zoom >= 200}
                  className="h-7 w-7 p-0"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {/* Download */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload} 
                disabled={!url}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              {/* Open in new tab */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenNew} 
                disabled={!url}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 w-full overflow-auto bg-muted/30">
          {url ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <iframe
                src={url}
                title={title}
                className="w-full h-full rounded-lg shadow-lg bg-white"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  minHeight: `${100 * (100 / zoom)}%`
                }}
                allow="fullscreen; clipboard-read; clipboard-write"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No document URL
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerEnhanced;
