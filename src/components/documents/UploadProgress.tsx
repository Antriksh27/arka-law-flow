import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadProgressState {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadProgressState[];
  onCancel?: (fileName: string) => void;
  className?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  uploads,
  onCancel,
  className
}) => {
  if (uploads.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {uploads.map((upload) => (
        <div 
          key={upload.fileName}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              upload.status === 'uploading' && "bg-sky-50",
              upload.status === 'completed' && "bg-emerald-50",
              upload.status === 'error' && "bg-rose-50",
              upload.status === 'cancelled' && "bg-slate-50"
            )}>
              {upload.status === 'uploading' && (
                <Upload className="w-5 h-5 text-sky-500 animate-pulse" />
              )}
              {upload.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
              {upload.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              {upload.status === 'cancelled' && (
                <X className="w-5 h-5 text-slate-400" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground truncate pr-2">
                  {upload.fileName}
                </p>
                {upload.status === 'uploading' && onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(upload.fileName)}
                    className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-rose-50 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {upload.status === 'uploading' && (
                <div className="space-y-1">
                  <Progress value={upload.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Uploading... {upload.progress.toFixed(0)}%
                  </p>
                </div>
              )}
              
              {upload.status === 'completed' && (
                <p className="text-xs text-emerald-600">Upload complete</p>
              )}
              
              {upload.status === 'error' && (
                <p className="text-xs text-rose-600">{upload.error || 'Upload failed'}</p>
              )}
              
              {upload.status === 'cancelled' && (
                <p className="text-xs text-slate-500">Upload cancelled</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
