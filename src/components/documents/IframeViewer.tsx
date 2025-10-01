import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface IframeViewerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  url: string | null;
}

export const IframeViewer: React.FC<IframeViewerProps> = ({ open, onClose, title = 'Document Viewer', url }) => {
  const handleOpenNew = () => {
    if (url) window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <Button variant="outline" size="sm" onClick={handleOpenNew} disabled={!url}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in new tab
            </Button>
          </div>
        </DialogHeader>

        <div className="w-full h-full bg-background">
          {url ? (
            <iframe
              src={url}
              title={title}
              className="w-full h-full"
              allow="fullscreen; clipboard-read; clipboard-write"
            />
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

export default IframeViewer;
