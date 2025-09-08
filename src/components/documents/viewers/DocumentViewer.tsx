import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import * as mammoth from 'mammoth';
import { useToast } from '@/hooks/use-toast';

interface DocumentViewerProps {
  url: string;
  fileName: string;
  fileType: 'doc' | 'docx' | 'txt' | 'rtf';
  onDownload?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  url, 
  fileName, 
  fileType,
  onDownload 
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        if (fileType === 'txt') {
          // Handle plain text files
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch text file');
          const text = await response.text();
          setContent(`<pre style="white-space: pre-wrap; font-family: monospace;">${text}</pre>`);
        } else if (fileType === 'doc' || fileType === 'docx') {
          // Handle Word documents with mammoth.js
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch Word document');
          
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          
          if (result.messages.length > 0) {
            console.warn('Mammoth conversion messages:', result.messages);
          }
          
          setContent(result.value);
        } else {
          throw new Error(`Unsupported file type: ${fileType}`);
        }
      } catch (err) {
        console.error('Document loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        toast({
          title: "Document Load Error",
          description: "Unable to preview this document. Try downloading it instead.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [url, fileType, toast]);

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
        <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">Document Preview Unavailable</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error || 'Unable to preview this document type'}. You can download the file or open it in a new tab.
        </p>
        <div className="flex gap-2">
          {onDownload && (
            <Button onClick={onDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          <Button onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <h3 className="font-medium text-foreground truncate">{fileName}</h3>
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

      {/* Document Content */}
      <div className="flex-1 overflow-auto bg-background p-6">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            fontFamily: fileType === 'txt' ? 'monospace' : 'inherit'
          }}
        />
      </div>
    </div>
  );
};