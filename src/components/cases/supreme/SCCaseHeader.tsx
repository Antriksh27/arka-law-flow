import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import { format } from 'date-fns';
import type { ParsedSCData } from '@/lib/scCaseDataParser';

interface SCCaseHeaderProps {
  data: ParsedSCData;
}

export const SCCaseHeader = ({ data }: SCCaseHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* Supreme Court Badge */}
      <div className="flex items-center gap-3">
        <Scale className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">Supreme Court of India</h1>
        <Badge variant={data.status === 'PENDING' ? 'warning' : 'disposed'}>
          {data.status || 'N/A'}
        </Badge>
      </div>

      {/* Main Case Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Diary Number</div>
                <div className="text-3xl font-bold text-primary">
                  {data.diaryNumber || 'N/A'}
                </div>
                {data.diarySection && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Section: {data.diarySection}
                  </div>
                )}
              </div>

              {data.caseNumbers && data.caseNumbers.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Case Number</div>
                  <div className="text-lg font-semibold text-foreground">
                    {data.caseNumbers[0].number}
                  </div>
                  {data.caseNumbers[0].registered_on && (
                    <div className="text-xs text-muted-foreground">
                      Registered: {format(new Date(data.caseNumbers[0].registered_on), 'dd MMM yyyy')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {data.filedOn && (
                <div>
                  <div className="text-sm text-muted-foreground">Filed On</div>
                  <div className="text-base font-medium text-foreground">{data.filedOn}</div>
                </div>
              )}
              
              {data.verifiedOn && (
                <div>
                  <div className="text-sm text-muted-foreground">Verified On</div>
                  <div className="text-base font-medium text-foreground">{data.verifiedOn}</div>
                </div>
              )}

              {data.lastListedOn && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Listed On</div>
                  <div className="text-base font-medium text-foreground">{data.lastListedOn}</div>
                </div>
              )}
            </div>
          </div>

          {/* Case Title */}
          <div className="mt-6 p-4 bg-background/80 rounded-lg border border-border">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-foreground">
                {data.petitioner || 'Petitioner'}
              </div>
              <div className="text-sm text-muted-foreground font-medium">vs.</div>
              <div className="text-lg font-semibold text-foreground">
                {data.respondent || 'Respondent'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
