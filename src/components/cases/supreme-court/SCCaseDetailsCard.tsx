import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, RefreshCw } from 'lucide-react';

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
  isRefreshing
}: SCCaseDetailsCardProps) {
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="py-3 border-b border-border last:border-0">
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-base text-foreground whitespace-pre-wrap">
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
          <div className="text-sm font-medium text-muted-foreground mb-1">{label1}</div>
          <div className="text-base text-foreground whitespace-pre-wrap">{value1 || '—'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">{label2}</div>
          <div className="text-base text-foreground whitespace-pre-wrap">{value2 || '—'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xl">Case Details</CardTitle>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onFetchDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onFetchDetails}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Fetch Details
            </Button>
          )}
        </div>
      </CardHeader>
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
    </Card>
  );
}
