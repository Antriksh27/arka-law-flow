import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isWebDAVDocument, parseWebDAVPath, downloadWebDAVFileDirectly } from '@/lib/webdavFileUtils';

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  document: any;
}

export const FileViewer: React.FC<FileViewerProps> = ({ open, onClose, document }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      if (isWebDAVDocument(document)) {
        const webdavParams = parseWebDAVPath(document.webdav_path);
        if (webdavParams) {
          await downloadWebDAVFileDirectly(webdavParams, document.file_name);
          toast({
            title: "Download Started",
            description: `Downloading ${document.file_name}`,
          });
          return;
        }
      }
      
      // Fallback for Supabase storage files
      let filePath = document.file_url;
      if (filePath.includes('/storage/v1/object/public/documents/')) {
        filePath = filePath.split('/storage/v1/object/public/documents/')[1];
      }
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${document.file_name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none bg-white p-0 m-0 rounded-none">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {document?.file_name || 'File Viewer'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload} disabled={loading}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4 overflow-auto">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {document?.file_name || 'Unknown File'}
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              File preview is not available. Please download to view the file.
            </p>
            <Button onClick={handleDownload} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Downloading...' : 'Download File'}
            </Button>
          </div>
        </div>

        {document && (
          <div className="p-6 pt-4 border-t text-sm text-gray-500">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">File Type:</span> {document.file_type?.toUpperCase() || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Size:</span> {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};