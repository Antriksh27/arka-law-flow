import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, RotateCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as mammoth from 'mammoth';

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  document: any;
}

export const FileViewer: React.FC<FileViewerProps> = ({ open, onClose, document }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();

  const getFileUrl = async () => {
    if (!document?.file_url) return;
    
    setLoading(true);
    try {
      // For WebDAV files, try edge function first, but have better fallbacks
      if (document.webdav_synced && document.webdav_path) {
        try {
          const { data: downloadResult, error } = await supabase.functions.invoke('pydio-webdav', {
            body: {
              operation: 'download',
              filePath: document.webdav_path
            }
          });
          
          if (!error && downloadResult?.success) {
            // WebDAV worked - create blob URL
            const base64Data = downloadResult.content;
            const binaryData = atob(base64Data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              bytes[i] = binaryData.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: document.file_type || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            setFileUrl(url);
            
            // For Word documents, process with mammoth.js
            if (getFileType() === 'word') {
              await processWordDocument(bytes.buffer);
            }
            
            return;
          }
        } catch (webdavError) {
          console.warn('WebDAV failed:', webdavError);
        }
        
        // WebDAV failed - use file_url directly (this used to work for images)
        console.log('Using direct URL fallback:', document.file_url);
        setFileUrl(document.file_url);
        
      } else {
        // Supabase storage files
        let filePath = document.file_url;
        
        if (filePath.includes('/storage/v1/object/public/documents/')) {
          filePath = filePath.split('/storage/v1/object/public/documents/')[1];
        }
        
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .download(filePath);

          if (!error && data) {
            const url = URL.createObjectURL(data);
            setFileUrl(url);
            
            if (getFileType() === 'word') {
              const arrayBuffer = await data.arrayBuffer();
              await processWordDocument(arrayBuffer);
            }
            return;
          }
        } catch (storageError) {
          console.warn('Supabase storage failed:', storageError);
        }
        
        // Storage failed - try signed URL
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600);

          if (!error && data) {
            setFileUrl(data.signedUrl);
            return;
          }
        } catch (signedUrlError) {
          console.warn('Signed URL failed:', signedUrlError);
        }
        
        // Last resort: use file_url directly
        setFileUrl(document.file_url);
      }
      
    } catch (error) {
      console.error('File loading error:', error);
      // Still try to set the direct URL as fallback
      setFileUrl(document.file_url);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && document) {
      getFileUrl();
    } else {
      setFileUrl(null);
      setDocumentHtml(null);
      setZoom(100);
      setRotation(0);
    }
  }, [open, document]);

  const handleDownload = async () => {
    try {
      // Check if this is a WebDAV file first
      if (document.webdav_synced && document.webdav_path) {
        try {
          const { data: downloadResult, error } = await supabase.functions.invoke('pydio-webdav', {
            body: {
              operation: 'download',
              filePath: document.webdav_path
            }
          });
          
          if (error || !downloadResult?.success) {
            throw new Error('WebDAV download failed');
          }
          
          // Create a blob from the base64 content
          const base64Data = downloadResult.content;
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: document.file_type || 'application/octet-stream' });
          
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = document.file_name;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        } catch (webdavError) {
          console.warn('WebDAV download failed, trying fallback');
        }
      }
      
      // Fallback for legacy Supabase storage files
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
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
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
    if (type.includes('doc') || type.includes('docx') || ['doc', 'docx'].includes(extension)) return 'word';
    if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) return 'excel';
    if (type.includes('powerpoint') || type.includes('presentation') || ['ppt', 'pptx'].includes(extension)) return 'powerpoint';
    if (type.includes('txt') || type.includes('text') || ['txt', 'text'].includes(extension)) return 'text';
    if (type.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'video';
    if (type.includes('audio') || ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) return 'audio';
    
    return 'unknown';
  };

  const processWordDocument = async (arrayBuffer: ArrayBuffer) => {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setDocumentHtml(result.value);
      if (result.messages.length > 0) {
        console.warn('Mammoth conversion messages:', result.messages);
      }
    } catch (error) {
      console.error('Error processing Word document:', error);
      toast({
        title: "Word Document Error",
        description: "Could not process Word document. Using fallback viewer.",
        variant: "destructive"
      });
    }
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
          <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col">
            <div className="flex items-center justify-between p-3 bg-white border-b">
              <span className="text-sm font-medium text-gray-700">{document.file_name}</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Download PDF since inline viewing has security issues
                    handleDownload();
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-white m-2 rounded border overflow-auto flex items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-4 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview Not Available</h3>
                  <p className="text-gray-600 mb-4">
                    PDF preview is blocked by browser security. Please download the file to view it.
                  </p>
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download {document.file_name}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'word':
        if (documentHtml) {
          return (
            <div className="w-full h-full bg-white rounded-lg overflow-auto p-6">
              <div 
                dangerouslySetInnerHTML={{ __html: documentHtml }}
                className="prose prose-sm max-w-none"
              />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg gap-4">
            <p className="text-gray-600 mb-2">Processing Word document...</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Original
            </Button>
          </div>
        );

      case 'excel':
      case 'powerpoint':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg gap-4">
            <p className="text-gray-600 mb-2">
              {fileType === 'excel' ? 'Excel Spreadsheet' : 'PowerPoint Presentation'}
            </p>
            <Button onClick={handleDownload} variant="outline">
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
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg gap-4">
            <p className="text-gray-600 mb-2">File Preview Not Available</p>
            <p className="text-sm text-gray-500 mb-4">This file type cannot be previewed in the browser</p>
            <Button onClick={handleDownload} variant="outline">
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