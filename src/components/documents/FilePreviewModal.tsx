import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { isWebDAVDocument, getWebDAVFileUrl, parseWebDAVPath } from '@/lib/webdavFileUtils';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: any;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ 
  open, 
  onClose, 
  document 
}) => {
  const { toast } = useToast();
  
  const handleDownload = async () => {
    if (!document) return;
    
    try {
      if (isWebDAVDocument(document)) {
        // For WebDAV files, use the direct URL
        const webdavParams = parseWebDAVPath(document.webdav_path);
        if (webdavParams) {
          const downloadUrl = getWebDAVFileUrl(webdavParams);
          const link = window.document.createElement('a');
          link.href = downloadUrl;
          link.download = document.file_name;
          link.target = '_blank';
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          
          toast({
            title: "Download Started",
            description: `Downloading ${document.file_name}`,
          });
          return;
        }
      }
      
      // Fallback for non-WebDAV files
      const response = await fetch(document.file_url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started", 
        description: `Downloading ${document.file_name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (!document) return;
    
    if (isWebDAVDocument(document)) {
      const webdavParams = parseWebDAVPath(document.webdav_path);
      if (webdavParams) {
        const fileUrl = getWebDAVFileUrl(webdavParams);
        window.open(fileUrl, '_blank');
        return;
      }
    }
    
    // Fallback for non-WebDAV files
    window.open(document.file_url, '_blank');
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none bg-white p-0 m-0 rounded-none">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {document.file_name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* File Preview */}
        <div className="flex-1 p-6 pt-4 overflow-hidden">
          <FilePreview 
            document={document}
            className="w-full h-full"
            showControls={false} // Hide controls since we have them in header
          />
        </div>

        {/* Footer with file info */}
        <div className="p-6 pt-4 border-t text-sm text-gray-500">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Type:</span> {document.file_type?.toUpperCase() || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Size:</span> {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Storage:</span> {isWebDAVDocument(document) ? 'WebDAV' : 'Supabase'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;