import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface SCCaseDetailsCardProps {
  diaryInfo?: string;
  caseTitle?: string;
  diaryNumber?: string;
  caseNumber?: string;
  cnrNumber?: string;
  presentLastListedOn?: string;
  statusStage?: string;
  category?: string;
  argumentTranscripts?: string | null;
  indexing?: string | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function SCCaseDetailsCard({
  diaryInfo,
  caseTitle,
  diaryNumber,
  caseNumber,
  cnrNumber,
  presentLastListedOn,
  statusStage,
  category,
  argumentTranscripts,
  indexing,
  isOpen = true,
  onToggle,
}: SCCaseDetailsCardProps) {

  return (
    <Card>
      <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle>Case Information</CardTitle>
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Diary Number', value: diaryNumber },
              { label: 'Case Number', value: caseNumber },
              { label: 'CNR Number', value: cnrNumber },
              { label: 'Present/Last Listed On', value: presentLastListedOn },
              { label: 'Status/Stage', value: statusStage },
              { label: 'Category', value: category },
              { label: 'Argument Transcripts', value: argumentTranscripts || 'N/A' },
              { label: 'Indexing', value: indexing || 'N/A' },
            ].filter(item => item.value && item.value !== 'N/A').map((item, index) => (
              <div key={index}>
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  );
}
