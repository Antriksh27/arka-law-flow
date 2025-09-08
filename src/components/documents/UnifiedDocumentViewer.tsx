import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import { PDFViewer } from './viewers/PDFViewer';
import { ImageViewer } from './viewers/ImageViewer';
import { DocumentViewer } from './viewers/DocumentViewer';
import { MediaViewer } from './viewers/MediaViewer';
import { detectFileType, formatFileSize, getFileIcon } from '@/lib/fileTypeDetection';
import { getWebDAVFileUrl, parseWebDAVPath, isWebDAVDocument } from '@/lib/webdavFileUtils';
import { callSupabaseFunction } from '@/lib/supabaseEdgeFunction';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  document: any;
}

export const UnifiedDocumentViewer: React.FC<UnifiedDocumentViewerProps> = ({ 
  open, 
  onClose, 
  document 
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fileTypeInfo = document ? detectFileType(document.file_name, document.file_type) : null;

  useEffect(() => {
    if (open && document) {
      loadFileUrl();
    } else {
      resetState();
    }
  }, [open, document]);

  const resetState = () => {
    setFileUrl(null);
    setLoading(false);
    setError(null);
  };

  const loadFileUrl = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if this is a WebDAV document
      if (isWebDAVDocument(document)) {
        const webdavParams = parseWebDAVPath(document.webdav_path);
        if (webdavParams) {
          const directUrl = getWebDAVFileUrl(webdavParams);
          setFileUrl(directUrl);
          setLoading(false);
          return;
        } else {
          throw new Error('Invalid WebDAV path format');
        }
      }

      // Handle Supabase storage files (legacy)
      let filePath = document.file_url;
      
      if (filePath.includes('/storage/v1/object/public/documents/')) {
        filePath = filePath.split('/storage/v1/object/public/documents/')[1];
      }

      try {
        // Try to get a signed URL for better access
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600);

        if (!error && data) {
          setFileUrl(data.signedUrl);
        } else {
          // Fallback to direct URL
          setFileUrl(document.file_url);
        }
      } catch (storageError) {
        console.warn('Storage access failed, using direct URL');
        setFileUrl(document.file_url);
      }

    } catch (err) {
      console.error('File loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file');
      toast({
        title: "File Load Error",
        description: "Unable to load the file for preview.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      // WebDAV download
      if (isWebDAVDocument(document)) {
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

      // Supabase storage download (legacy)
      let filePath = document.file_url;
      if (filePath.includes('/storage/v1/object/public/documents/')) {
        filePath = filePath.split('/storage/v1/object/public/documents/')[1];
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${document.file_name} has been downloaded`,
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

  const renderViewer = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading file...</p>
          </div>
        </div>
      );
    }

    if (error || !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
          <AlertTriangle className="w-16 h-16 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground">Unable to Load File</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {error || 'File could not be loaded for preview'}. You can try downloading the file instead.
          </p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      );
    }

    if (!fileTypeInfo?.canPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
            {getFileIcon(fileTypeInfo)}
          </div>
          <h3 className="text-lg font-medium text-foreground">Preview Not Available</h3>
          <p className="text-muted-foreground text-center max-w-md">
            This file type cannot be previewed in the browser. Please download the file to view it.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => window.open(fileUrl, '_blank')} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      );
    }

    // Render appropriate viewer based on file type
    switch (fileTypeInfo.category) {
      case 'pdf':
        return (
          <PDFViewer
            url={fileUrl}
            fileName={document.file_name}
            onDownload={handleDownload}
          />
        );

      case 'image':
        return (
          <ImageViewer
            url={fileUrl}
            fileName={document.file_name}
            onDownload={handleDownload}
            className="flex flex-col h-full"
          />
        );

      case 'document':
        if (fileTypeInfo.extension === 'doc' || fileTypeInfo.extension === 'docx') {
          return (
            <DocumentViewer
              url={fileUrl}
              fileName={document.file_name}
              fileType={fileTypeInfo.extension as 'doc' | 'docx'}
              onDownload={handleDownload}
            />
          );
        }
        break;

      case 'text':
        return (
          <DocumentViewer
            url={fileUrl}
            fileName={document.file_name}
            fileType="txt"
            onDownload={handleDownload}
          />
        );

      case 'video':
      case 'audio':
        return (
          <MediaViewer
            url={fileUrl}
            fileName={document.file_name}
            mediaType={fileTypeInfo.category}
            onDownload={handleDownload}
            className="flex flex-col h-full"
          />
        );
    }

    // Fallback for unsupported but previewable files
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
        <div className="text-2xl">{getFileIcon(fileTypeInfo)}</div>
        <h3 className="text-lg font-medium text-foreground">Basic Preview</h3>
        <iframe
          src={fileUrl}
          className="w-full h-96 border border-border rounded"
          title={document.file_name}
        />
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={() => window.open(fileUrl, '_blank')} variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none bg-background p-0 m-0 rounded-none">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold truncate pr-4 flex items-center gap-2">
            <span className="text-lg">{fileTypeInfo ? getFileIcon(fileTypeInfo) : '📄'}</span>
            {document.file_name}
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

        <div className="flex-1 overflow-hidden">
          {renderViewer()}
        </div>

        {/* Footer with file information */}
        <div className="p-4 border-t text-sm text-muted-foreground bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>
                <strong>Type:</strong> {fileTypeInfo?.category.toUpperCase() || 'Unknown'}
              </span>
              {document.file_size && (
                <span>
                  <strong>Size:</strong> {formatFileSize(document.file_size)}
                </span>
              )}
              {document.created_at && (
                <span>
                  <strong>Uploaded:</strong> {new Date(document.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {isWebDAVDocument(document) && (
              <span className="text-blue-600 font-medium">WebDAV</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};