import React from 'react';
import { Folder, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoragePathPreviewProps {
  clientName?: string;
  caseTitle?: string;
  caseNumber?: string | null;
  primaryType?: string;
  subType?: string;
  fileName?: string;
  className?: string;
}

export const StoragePathPreview: React.FC<StoragePathPreviewProps> = ({
  clientName,
  caseTitle,
  caseNumber,
  primaryType,
  subType,
  fileName,
  className
}) => {
  // Don't render if we don't have minimum required fields
  if (!clientName && !caseTitle && !primaryType) {
    return null;
  }

  const pathSegments = [
    { label: 'Clients', icon: Folder, value: null },
    { label: clientName || '...', icon: Folder, value: clientName },
    { label: 'Cases', icon: Folder, value: caseTitle ? 'Cases' : null },
    { 
      label: caseNumber ? `${caseTitle} (${caseNumber})` : (caseTitle || '...'), 
      icon: Folder, 
      value: caseTitle 
    },
    { label: primaryType || '...', icon: Folder, value: primaryType },
    { label: subType || '...', icon: Folder, value: subType },
    { label: fileName || 'your_file.pdf', icon: FileText, value: fileName }
  ];

  // Filter out empty segments but keep the structure
  const visibleSegments = pathSegments.filter((segment, index) => {
    // Always show first segment (Clients)
    if (index === 0) return true;
    // Show segment if it has a value or if a later segment has a value
    const hasValue = segment.value;
    const laterHasValue = pathSegments.slice(index + 1).some(s => s.value);
    return hasValue || laterHasValue;
  });

  return (
    <div className={cn("bg-muted/50 rounded-lg p-4 border border-border", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Folder className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Storage Path Preview
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-1 text-sm">
        {visibleSegments.map((segment, index) => {
          const Icon = segment.icon;
          const isLast = index === visibleSegments.length - 1;
          const hasValue = segment.value;
          
          return (
            <React.Fragment key={index}>
              <div 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded",
                  hasValue 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                <span className={cn(
                  "font-mono text-xs",
                  !hasValue && "italic"
                )}>
                  {segment.label}
                </span>
              </div>
              {!isLast && (
                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {(!clientName || !caseTitle || !primaryType || !subType) && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          Complete all fields to see the full storage path
        </p>
      )}
    </div>
  );
};
