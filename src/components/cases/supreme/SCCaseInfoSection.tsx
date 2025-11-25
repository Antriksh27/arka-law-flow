import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale } from 'lucide-react';
import type { ParsedSCData } from '@/lib/scCaseDataParser';

interface SCCaseInfoSectionProps {
  data: ParsedSCData;
}

export const SCCaseInfoSection = ({ data }: SCCaseInfoSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Core Case Information */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-foreground mb-4">Case Details</h3>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">CNR Number</div>
            <div className="font-mono text-base font-medium text-foreground">
              {data.cnrNumber || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Category</div>
            <div className="text-base text-foreground">
              {data.category || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Status / Stage</div>
            <Badge variant="outline" className="text-sm">
              {data.statusStage || 'N/A'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bench Composition */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Bench Composition
          </h3>
          
          {data.benchComposition && data.benchComposition.length > 0 ? (
            <div className="space-y-2">
              {data.benchComposition.map((judge, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 text-sm text-foreground p-2 bg-muted/50 rounded"
                >
                  <Scale className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="font-medium">{judge}</span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground mt-3">
                {data.benchComposition.length} Judge{data.benchComposition.length > 1 ? 's' : ''} Bench
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Bench composition not available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
