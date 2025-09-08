
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  document: any;
}

export const FileViewer: React.FC<FileViewerProps> = ({ open, onClose, document }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();

  const getFileUrl = async () => {
    if (!document?.file_url) return;
    
    setLoading(true);
    try {
      // Check if this is a WebDAV/Pydio file
      if (document.webdav_synced && document.webdav_path) {
        // For WebDAV files, we need to create a download URL through our edge function
        console.log('Loading WebDAV file:', document.webdav_path);
        
        const { data: downloadResult, error } = await supabase.functions.invoke('pydio-webdav', {
          body: {
            operation: 'download',
            filePath: document.webdav_path
          }
        });
        
        if (error || !downloadResult?.success) {
          throw new Error(downloadResult?.error || 'Failed to download from WebDAV');
        }
        
        // Create a blob URL from the returned content
        const base64Data = downloadResult.content;
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: document.file_type });
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
      } else {
        // Legacy Supabase storage files
        let filePath = document.file_url;
        
        if (filePath.includes('/storage/v1/object/public/documents/')) {
          filePath = filePath.split('/storage/v1/object/public/documents/')[1];
        }
        
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600);

        if (error) throw error;
        setFileUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting file URL:', error);
      toast({
        title: "Failed to load file",
        description: "Could not load the file for viewing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && document) {
      getFileUrl();
    } else {
      setFileUrl(null);
      setZoom(100);
      setRotation(0);
    }
  }, [open, document]);

  const handleDownload = async () => {
    try {
      // Extract the file path from the public URL for download
      let filePath = document.file_url;
      
      // If it's a full URL, extract the path after the bucket name
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
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the document",
        variant: "destructive"
      });
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const getFileType = () => {
    if (!document?.file_type) return 'unknown';
    const type = document.file_type.toLowerCase();
    
    // Check file extension if MIME type is not reliable
    const fileName = document.file_name?.toLowerCase() || '';
    const extension = fileName.split('.').pop() || '';
    
    if (type.includes('pdf') || extension === 'pdf') return 'pdf';
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
    if (type.includes('doc') || type.includes('docx') || ['doc', 'docx'].includes(extension)) return 'document';
    if (type.includes('txt') || type.includes('text') || ['txt', 'text'].includes(extension)) return 'text';
    if (type.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'video';
    if (type.includes('audio') || ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) return 'audio';
    
    return 'unknown';
  };

  const renderFileContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Failed to load file</p>
        </div>
      );
    }

    const fileType = getFileType();

    switch (fileType) {
      case 'image':
        return (
          <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
            <img
              src={fileUrl}
              alt={document.file_name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-full bg-gray-50 rounded-lg">
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full h-full rounded-lg"
              title={document.file_name}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-600 mb-4">PDF cannot be displayed in this browser</p>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </object>
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">Word documents can't be previewed directly</p>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download to View
            </Button>
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-full bg-gray-50 rounded-lg overflow-auto">
            <iframe
              src={fileUrl}
              className="w-full h-full rounded-lg"
              title={document.file_name}
            />
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
            <audio
              src={fileUrl}
              controls
              className="w-full max-w-md"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        );
    }
  };

  const showZoomControls = getFileType() === 'image';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none bg-white p-0 m-0 rounded-none">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {document?.file_name || 'File Viewer'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {showZoomControls && (
              <>
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4 overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
          {renderFileContent()}
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
