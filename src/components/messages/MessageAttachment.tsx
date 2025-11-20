import React, { useState } from 'react';
import { FileAttachment } from '@/hooks/use-file-upload';
import { FileText, Download, Image as ImageIcon, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MessageAttachmentProps {
  attachment: FileAttachment;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  attachment,
  className,
}) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';

  const handleDownload = () => {
    window.open(attachment.url, '_blank');
  };

  if (isImage) {
    return (
      <>
        <div
          className={cn(
            'relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity max-w-sm',
            className
          )}
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-auto max-h-64 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
            <p className="text-white text-xs truncate">{attachment.name}</p>
          </div>
        </div>

        <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
          <DialogContent className="max-w-4xl">
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-full h-auto"
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors max-w-sm',
        className
      )}
    >
      <div className="flex-shrink-0">
        {isPdf ? (
          <FileText className="w-8 h-8 text-red-500" />
        ) : (
          <FileType className="w-8 h-8 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="flex-shrink-0"
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
};
