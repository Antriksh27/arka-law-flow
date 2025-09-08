import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, AlertCircle } from 'lucide-react';
import { getWebDAVFileUrl, parseWebDAVPath, getFileTypeFromExtension, isWebDAVDocument } from '@/lib/webdavFileUtils';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewProps {
  document: any;
  className?: string;
  showControls?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  document, 
  className = "w-full h-96", 
  showControls = true 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!document) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg`}>
        <p className="text-gray-500">No document selected</p>
      </div>
    );
  }

  // Check if this is a WebDAV document
  const isWebDAV = isWebDAVDocument(document);
  
  let fileUrl: string | null = null;
  let fileType = 'unknown';
  
  if (isWebDAV) {
    // Parse WebDAV path and generate direct URL
    const webdavParams = parseWebDAVPath(document.webdav_path);
    if (webdavParams) {
      fileUrl = getWebDAVFileUrl(webdavParams);
      fileType = getFileTypeFromExtension(webdavParams.fileName);
    } else {
      setError('Invalid WebDAV path format');
    }
  } else {
    // Use existing file_url for non-WebDAV files
    fileUrl = document.file_url;
    fileType = getFileTypeFromExtension(document.file_name);
  }

  const handleDownload = async () => {
    if (!fileUrl) return;
    
    try {
      setLoading(true);
      
      if (isWebDAV) {
        // For WebDAV files, the URL already handles the download
        const link = window.document.createElement('a');
        link.href = fileUrl;
        link.download = document.file_name;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        // Handle non-WebDAV files (legacy Supabase storage)
        const response = await fetch(fileUrl);
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
      }
      
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
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setError('Failed to load image');
  };

  const handleFrameError = () => {
    setError('Failed to load document');
  };

  const renderFileContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg gap-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          {showControls && (
            <Button onClick={handleDownload} variant="outline" disabled={loading || !fileUrl}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Downloading...' : 'Download File'}
            </Button>
          )}
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-gray-500">Unable to generate file URL</p>
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <div className="relative h-full bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={fileUrl}
              alt={document.file_name}
              className="w-full h-full object-contain"
              onError={handleImageError}
            />
            {showControls && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleDownload} disabled={loading}>
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => window.open(fileUrl, '_blank')}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="relative h-full bg-gray-50 rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={document.file_name}
              onError={handleFrameError}
              allow="fullscreen"
              style={{ minHeight: '500px' }}
            />
            {showControls && (
              <div className="absolute top-2 right-2 flex gap-2 bg-white/90 p-1 rounded">
                <Button size="sm" variant="secondary" onClick={handleDownload} disabled={loading}>
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => window.open(fileUrl, '_blank')}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="relative h-full bg-white rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full border border-gray-200"
              title={document.file_name}
              onError={handleFrameError}
            />
            {showControls && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleDownload} disabled={loading}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-black rounded-lg">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full"
              onError={handleFrameError}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <audio
              src={fileUrl}
              controls
              className="w-full max-w-md"
              onError={handleFrameError}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      default:
        // For unsupported file types, show download button
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {document.file_name}
              </h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              {showControls && (
                <Button onClick={handleDownload} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? 'Downloading...' : 'Download to View'}
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderFileContent()}
    </div>
  );
};

export default FilePreview;