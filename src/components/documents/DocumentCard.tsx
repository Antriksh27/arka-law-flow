import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Star, StarOff, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getFileIcon } from '@/lib/fileUtils';
import { getFileTypeFromExtension, isWebDAVDocument, downloadWebDAVFileDirectly, parseWebDAVPath } from '@/lib/webdavFileUtils';
import { UnifiedDocumentViewer } from './UnifiedDocumentViewer';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

interface DocumentCardProps {
  document: any;
  onRefresh: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onRefresh }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!document) return null;

  const FileIcon = getFileIcon(document.file_type);
  const fileType = getFileTypeFromExtension(document.file_name);
  const isWebDAV = isWebDAVDocument(document);

  const handleViewDocument = () => {
    setShowFileViewer(true);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      if (isWebDAV) {
        // For WebDAV files, use direct download
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

      // Handle non-WebDAV files (legacy Supabase storage)
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

      onRefresh();
    } catch (error) {
      console.error('Toggle important error:', error);
      toast({
        title: "Failed to update document",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <>
      <div
        className="relative bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* File Icon and Name */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <FileIcon className="w-12 h-12 text-blue-600" />
            {document.is_evidence && (
              <Star className="w-4 h-4 text-yellow-500 fill-current absolute -top-1 -right-1" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
              {document.file_name}
            </h3>
            
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="outline" className="text-xs">
                {document.file_type?.toUpperCase() || 'Unknown'}
              </Badge>
              {isWebDAV && (
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                  WebDAV
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* File Details */}
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <div>Size: {formatFileSize(document.file_size)}</div>
          <div>
            {document.uploaded_at 
              ? format(new Date(document.uploaded_at), 'MMM d, yyyy')
              : 'Unknown date'
            }
          </div>
        </div>

        {/* Action Buttons - Show on hover */}
        {isHovered && (
          <div className="absolute inset-x-2 bottom-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDocument}
              className="flex-1 h-8 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 h-8 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              {loading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleImportant}
              className="p-1 h-8"
            >
              {document.is_evidence ? (
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
              ) : (
                <StarOff className="w-3 h-3 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="p-1 h-8 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <UnifiedDocumentViewer
        open={showFileViewer}
        onClose={() => setShowFileViewer(false)}
        document={document}
      />

      <DeleteDocumentDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        document={document}
        onDeleted={onRefresh}
      />
    </>
  );
};