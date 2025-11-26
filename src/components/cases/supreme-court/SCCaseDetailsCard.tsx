import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { RefreshCw, Pencil, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface SCCaseDetailsCardProps {
  diaryInfo?: string;
  caseTitle?: string;
  diaryNumber?: string;
  caseNumber?: string;
  cnrNumber?: string;
  presentLastListedOn?: string;
  statusStage?: string;
  category?: string;
  petitioners?: string;
  respondents?: string;
  petitionerAdvocates?: string;
  respondentAdvocates?: string;
  argumentTranscripts?: string | null;
  indexing?: string | null;
  onEdit?: () => void;
  onFetchDetails?: () => void;
  isRefreshing?: boolean;
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
  petitioners,
  respondents,
  petitionerAdvocates,
  respondentAdvocates,
  argumentTranscripts,
  indexing,
  onEdit,
  onFetchDetails,
  isRefreshing,
  isOpen = true,
  onToggle,
}: SCCaseDetailsCardProps) {
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="py-3 border-b border-border last:border-0">
      <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-base text-gray-900 whitespace-pre-wrap">
        {value || '—'}
      </div>
    </div>
  );

  const TwoColumnRow = ({ 
    label1, value1, label2, value2 
  }: { 
    label1: string; value1?: string | null; 
    label2: string; value2?: string | null; 
  }) => (
    <div className="py-3 border-b border-border last:border-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">{label1}</div>
          <div className="text-base text-gray-900 whitespace-pre-wrap">{value1 || '—'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">{label2}</div>
          <div className="text-base text-gray-900 whitespace-pre-wrap">{value2 || '—'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Case Information</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onFetchDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFetchDetails();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Fetch
                </Button>
              )}
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="space-y-0">
          <InfoRow label="Diary Info" value={diaryInfo} />
          <InfoRow label="Case Title" value={caseTitle} />
          <InfoRow label="Diary Number" value={diaryNumber} />
          <InfoRow label="Case Number" value={caseNumber} />
          <InfoRow label="CNR Number" value={cnrNumber} />
          <InfoRow label="Present/Last Listed On" value={presentLastListedOn} />
          <InfoRow label="Status/Stage" value={statusStage} />
          <InfoRow label="Category" value={category} />
          <TwoColumnRow 
            label1="Petitioner(s)" 
            value1={petitioners}
            label2="Respondent(s)"
            value2={respondents}
          />
          <InfoRow label="Petitioner Advocate(s)" value={petitionerAdvocates} />
          <InfoRow label="Respondent Advocate(s)" value={respondentAdvocates} />
          <TwoColumnRow 
            label1="Argument Transcripts" 
            value1={argumentTranscripts || 'null'}
            label2="Indexing"
            value2={indexing || 'null'}
          />
        </CardContent>
      </CollapsibleContent>
    </Card>
  );
}
