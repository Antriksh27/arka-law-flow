import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';
import { pdfjs } from '@/lib/pdfSetup';
import { useToast } from '@/hooks/use-toast';

interface PDFViewerProps {
  url: string;
  fileName: string;
  onDownload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, fileName, onDownload }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
    toast({
      title: "PDF Load Error",
      description: "Unable to load PDF. Try downloading the file instead.",
      variant: "destructive"
    });
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
        <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">PDF Preview Unavailable</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error}. You can still download or open the file in a new tab to view it.
        </p>
        <div className="flex gap-2">
          {onDownload && (
            <Button onClick={onDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          <Button onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[50px] text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-muted/20 flex justify-center p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="shadow-lg"
          loading={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="border border-border bg-background shadow-sm"
            loading={
              <div className="flex items-center justify-center min-h-[400px] bg-background border border-border">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
};