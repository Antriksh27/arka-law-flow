import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Star, StarOff, ExternalLink } from 'lucide-react';
import { detectFileType, formatFileSize, getFileIcon } from '@/lib/fileTypeDetection';
import { isWebDAVDocument, parseWebDAVPath, downloadWebDAVFileDirectly } from '@/lib/webdavFileUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DocumentPreviewCardProps {
  document: any;
  onView?: () => void;
  onRefresh?: () => void;
  showActions?: boolean;
  className?: string;
}

export const DocumentPreviewCard: React.FC<DocumentPreviewCardProps> = ({
  document,
  onView,
  onRefresh,
  showActions = true,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!document) return null;

  const fileTypeInfo = detectFileType(document.file_name, document.file_type);
  const fileIcon = getFileIcon(fileTypeInfo);

  const handleDownload = async () => {
    setLoading(true);
    try {
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
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Downloaded ${document.file_name}`,
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

  const toggleImportant = async () => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_evidence: !document.is_evidence })
        .eq('id', document.id);

      if (error) throw error;

      toast({
        title: document.is_evidence ? "Removed from important" : "Marked as important",
        description: `Document ${document.is_evidence ? 'unmarked' : 'marked'} as important`,
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Toggle important error:', error);
      toast({
        title: "Failed to update document",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (isWebDAVDocument(document)) {
      toast({
        title: "WebDAV File",
        description: "Please use download to access WebDAV files.",
        variant: "default"
      });
    } else {
      window.open(document.file_url, '_blank');
    }
  };

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-2xl">{fileIcon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate mb-1">
                {document.file_name}
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {fileTypeInfo.category.toUpperCase()}
                </Badge>
                {isWebDAVDocument(document) && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                    WebDAV
                  </Badge>
                )}
                {document.is_evidence && (
                  <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                    Important
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleImportant}
                className="p-1 hover:bg-muted"
              >
                {document.is_evidence ? (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                ) : (
                  <StarOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground mb-3 space-y-1">
          <div>Size: {formatFileSize(document.file_size || 0)}</div>
          <div>
            Uploaded: {document.created_at ? format(new Date(document.created_at), 'MMM d, yyyy') : 'Unknown'}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            {fileTypeInfo.canPreview && onView && (
              <Button size="sm" variant="outline" onClick={onView} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              disabled={loading}
              className={fileTypeInfo.canPreview && onView ? "" : "flex-1"}
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Downloading..." : "Download"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};