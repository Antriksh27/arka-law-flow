
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Star, StarOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getFileIcon } from '@/lib/fileUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FileViewer } from './FileViewer';
import { FilePreviewModal } from './FilePreviewModal';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { isWebDAVDocument, getWebDAVFileUrl, parseWebDAVPath } from '@/lib/webdavFileUtils';

interface DocumentCardProps {
  document: any;
  onRefresh: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onRefresh }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const FileIcon = getFileIcon(document.file_type);

  const handleViewDocument = () => {
    setShowFileViewer(true);
  };

  const handleDownload = async () => {
    try {
      if (isWebDAVDocument(document)) {
        // For WebDAV files, use the direct URL
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
      
      // Fallback for non-WebDAV files
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${document.file_name}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the document",
        variant: "destructive"
      });
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
        description: `Document ${document.is_evidence ? 'unmarked' : 'marked'} as important`
      });
      
      onRefresh();
    } catch (error) {
      toast({
        title: "Failed to update document",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 cursor-pointer group",
          isHovered && "shadow-lg border-gray-300 scale-105"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* File Icon */}
        <div className="flex flex-col items-center mb-3">
          <div className="relative">
            <FileIcon className="w-12 h-12 text-gray-500 mb-2" />
            {document.is_evidence && (
              <Star className="w-4 h-4 text-yellow-500 fill-current absolute -top-1 -right-1" />
            )}
          </div>
          
          {/* File Name */}
          <h3 className="text-sm font-medium text-gray-900 text-center truncate leading-tight max-w-32" title={document.file_name}>
            {document.file_name}
          </h3>
        </div>

        {/* File Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="text-xs">
              {document.file_type?.toUpperCase() || 'Unknown'}
            </Badge>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(document.file_size)}
            </p>
          </div>
        </div>

        {/* Actions - Show on hover */}
        <div className={cn(
          "flex items-center justify-center gap-1 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleViewDocument}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={toggleImportant}
          >
            {document.is_evidence ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-400" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Folder/Case Info */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center truncate">
            {document.folder_name || 'General'}
          </p>
        </div>
      </div>

      <FilePreviewModal
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
