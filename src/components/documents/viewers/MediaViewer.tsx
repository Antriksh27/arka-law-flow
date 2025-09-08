import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Volume2, VolumeX } from 'lucide-react';

interface MediaViewerProps {
  url: string;
  fileName: string;
  mediaType: 'video' | 'audio';
  onDownload?: () => void;
  className?: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ 
  url, 
  fileName, 
  mediaType,
  onDownload,
  className = "w-full h-full" 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [muted, setMuted] = useState(false);

  const handleMediaLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleMediaError = () => {
    setLoading(false);
    setError(true);
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-muted/30 rounded-lg gap-4 p-8`}>
        <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
          {mediaType === 'video' ? (
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 011-1h1a1 1 0 010 2H6a1 1 0 01-1-1zm6 1a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.447 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.447l3.936-3.793z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-medium text-foreground">Failed to Load {mediaType}</h3>
        <p className="text-muted-foreground text-center">
          Unable to play this {mediaType} file. Try downloading or opening in a new tab.
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
      {/* Media Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <h3 className="font-medium text-foreground truncate">{fileName}</h3>
        <div className="flex items-center gap-2">
          {mediaType === 'video' && (
            <Button variant="outline" size="sm" onClick={toggleMute}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
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

      {/* Media Display */}
      <div className="flex-1 bg-black flex items-center justify-center p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Loading {mediaType}...</p>
            </div>
          </div>
        )}
        
        {mediaType === 'video' ? (
          <video
            src={url}
            controls
            muted={muted}
            className="max-w-full max-h-full shadow-lg"
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.447 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.447l3.936-3.793z" clipRule="evenodd" />
              </svg>
            </div>
            <audio
              src={url}
              controls
              className="w-full max-w-md"
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              preload="metadata"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
};