import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';

interface SimplePDFViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
}

export const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({ 
  fileUrl, 
  fileName, 
  onDownload 
}) => {
  const [viewerType, setViewerType] = useState<'native' | 'google' | 'download'>('native');
  const [loading, setLoading] = useState(true);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    console.log('Native PDF viewer failed, switching to Google Docs viewer');
    setViewerType('google');
    setLoading(false);
  };

  const switchToGoogle = () => {
    setViewerType('google');
    setLoading(true);
  };

  const switchToNative = () => {
    setViewerType('native');
    setLoading(true);
  };

  const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={viewerType === 'native' ? switchToGoogle : switchToNative}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {viewerType === 'native' ? 'Try Google Viewer' : 'Try Native Viewer'}
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(fileUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative bg-gray-100">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {viewerType === 'native' ? (
          <iframe
            src={fileUrl + '#toolbar=1&navpanes=1&scrollbar=1&view=FitH'}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        ) : (
          <iframe
            src={googleDocsUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={handleIframeLoad}
            onError={() => {
              console.error('Google Docs viewer also failed');
              setLoading(false);
            }}
          />
        )}
      </div>
      
      {!loading && viewerType === 'google' && (
        <div className="p-2 bg-yellow-50 border-t text-xs text-yellow-800">
          Using Google Docs viewer. For better experience, try downloading the PDF.
        </div>
      )}
    </div>
  );
};