import React from 'react';
import { Button } from '@/components/ui/button';
import { StickyNote, CheckSquare, Upload, RefreshCw } from 'lucide-react';

interface CaseDetailHeaderProps {
  caseTitle: string;
  onAddNote: () => void;
  onAddTask: () => void;
  onUploadDocument: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const CaseDetailHeader: React.FC<CaseDetailHeaderProps> = ({
  caseTitle,
  onAddNote,
  onAddTask,
  onUploadDocument,
  onRefreshData,
  isRefreshing = false
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">{caseTitle}</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onAddNote}>
            <StickyNote className="w-4 h-4 mr-2" />
            Add Note
          </Button>
          <Button variant="outline" size="sm" onClick={onAddTask}>
            <CheckSquare className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button variant="outline" size="sm" onClick={onUploadDocument}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onRefreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
};
