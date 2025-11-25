import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface SCMetadataCardProps {
  legalkartCase: any;
}

export const SCMetadataCard = ({ legalkartCase }: SCMetadataCardProps) => {
  if (!legalkartCase) return null;
  
  const hasMetadata = legalkartCase.argument_transcripts || 
                      legalkartCase.indexing || 
                      legalkartCase.mention_memo || 
                      legalkartCase.drop_note || 
                      legalkartCase.caveat;
  
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
        {renderMetadataItem('Argument Transcripts', legalkartCase.argument_transcripts)}
        {renderMetadataItem('Indexing', legalkartCase.indexing)}
        {renderMetadataItem('Mention Memo', legalkartCase.mention_memo)}
        {renderMetadataItem('Drop Note', legalkartCase.drop_note)}
        {renderMetadataItem('Caveat', legalkartCase.caveat)}
      </CardContent>
    </Card>
  );
};
