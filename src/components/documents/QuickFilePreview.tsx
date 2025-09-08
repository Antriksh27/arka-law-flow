import React from 'react';
import { detectFileType, getFileIcon } from '@/lib/fileTypeDetection';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';

interface QuickFilePreviewProps {
  document: any;
  onView: () => void;
  onDownload: () => void;
  className?: string;
}

export const QuickFilePreview: React.FC<QuickFilePreviewProps> = ({
  document,
  onView,
  onDownload,
  className = "w-full"
}) => {
  if (!document) return null;

  const fileTypeInfo = detectFileType(document.file_name, document.file_type);
  const fileIcon = getFileIcon(fileTypeInfo);

  return (
    <div className={`${className} bg-muted/30 rounded-lg p-4 border border-border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-2xl">{fileIcon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {document.file_name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {fileTypeInfo.category.toUpperCase()} • {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          {fileTypeInfo.canPreview && (
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};