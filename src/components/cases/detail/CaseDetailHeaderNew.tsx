import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, StickyNote, CheckSquare, RefreshCw } from 'lucide-react';
import { formatDateLong } from '@/lib/caseDataFormatter';

interface CaseDetailHeaderNewProps {
  caseData: any;
  onRefresh: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
  onViewDocuments: () => void;
  isRefreshing?: boolean;
}

export const CaseDetailHeaderNew = ({
  caseData,
  onRefresh,
  onAddNote,
  onAddTask,
  onViewDocuments,
  isRefreshing = false
}: CaseDetailHeaderNewProps) => {
  return (
    <Card className="bg-white shadow-sm border-[#E5E7EB] sticky top-0 z-20 mb-6">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Case Title & Key Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#111827] mb-2">
              {caseData?.title || 'Case Details'}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-[#6B7280]">
              <div>
                <span className="font-medium">Case Number:</span>{' '}
                {caseData?.case_number || caseData?.filing_number || 'N/A'}
              </div>
              <div>
                <span className="font-medium">CNR:</span>{' '}
                {caseData?.cnr_number || 'N/A'}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-3">
              {caseData?.reference_number && (
                <Badge variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                  Ref: {caseData.reference_number}
                </Badge>
              )}
              {caseData?.next_hearing_date && (
                <Badge variant="default" className="bg-[#1E3A8A] text-white">
                  Next Hearing: {formatDateLong(caseData.next_hearing_date)}
                </Badge>
              )}
              {caseData?.stage_of_case && (
                <Badge variant="outline">
                  {caseData.stage_of_case}
                </Badge>
              )}
              {caseData?.status && (
                <Badge variant={caseData.status === 'open' ? 'default' : 'outline'}>
                  {caseData.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDocuments}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Documents
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAddNote}
              className="flex items-center gap-2"
            >
              <StickyNote className="h-4 w-4" />
              Add Note
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAddTask}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Add Task
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
