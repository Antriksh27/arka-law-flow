import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, ExternalLink, Maximize } from 'lucide-react';

interface ImageViewerProps {
  url: string;
  fileName: string;
  onDownload?: () => void;
  className?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  url, 
  fileName, 
  onDownload,
  className = "w-full h-full" 
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-muted/30 rounded-lg gap-4 p-8`}>
        <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">Failed to Load Image</h3>
        <p className="text-muted-foreground text-center">
          Unable to display the image. Try downloading or opening in a new tab.
        </p>
        <div className="flex gap-2">
          {onDownload && (
            <Button onClick={onDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Image Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 25}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[50px] text-center">
            {zoom}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 300}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
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

      {/* Image Display */}
      <div className="flex-1 bg-muted/20 flex items-center justify-center p-4 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Loading image...</p>
            </div>
          </div>
        )}
        
        <img
          src={url}
          alt={fileName}
          className="max-w-none max-h-none object-contain transition-transform duration-200 shadow-lg"
          style={{ 
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>
  );
};