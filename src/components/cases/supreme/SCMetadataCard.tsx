import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface SCMetadataCardProps {
  legalkartCase?: any;
  rawData?: any;
}

export const SCMetadataCard = ({ legalkartCase, rawData }: SCMetadataCardProps) => {
  // Try to get metadata from legalkart case or parse from raw data
  const caseDetails = rawData?.data?.case_details || {};
  
  const hasMetadata = legalkartCase?.argument_transcripts || 
                      legalkartCase?.indexing || 
                      legalkartCase?.mention_memo || 
                      legalkartCase?.drop_note || 
                      legalkartCase?.caveat ||
                      caseDetails['Argument Transcripts'] ||
                      caseDetails['Indexing'] ||
                      caseDetails['Mention Memo'] ||
                      caseDetails['Drop Note'] ||
                      caseDetails['Caveat'];
  
  if (!hasMetadata) {
    return (
      <div className="text-sm text-muted-foreground">
        No additional metadata available
      </div>
    );
  }
  
  const renderMetadataItem = (label: string, value: any) => {
    if (!value) return null;
    
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="text-sm bg-muted/50 p-3 rounded border border-border">
          {typeof value === 'string' ? (
            <pre className="whitespace-pre-wrap font-sans">{value}</pre>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-xs">
              {JSON.stringify(value, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>Case Metadata</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderMetadataItem('Argument Transcripts', legalkartCase?.argument_transcripts || caseDetails['Argument Transcripts'])}
        {renderMetadataItem('Indexing', legalkartCase?.indexing || caseDetails['Indexing'])}
        {renderMetadataItem('Mention Memo', legalkartCase?.mention_memo || caseDetails['Mention Memo'])}
        {renderMetadataItem('Drop Note', legalkartCase?.drop_note || caseDetails['Drop Note'])}
        {renderMetadataItem('Caveat', legalkartCase?.caveat || caseDetails['Caveat'])}
      </CardContent>
    </Card>
  );
};
