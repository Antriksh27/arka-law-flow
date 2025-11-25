import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Scale, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface SCCaseHeaderCardProps {
  legalkartCase: any;
}

export const SCCaseHeaderCard = ({ legalkartCase }: SCCaseHeaderCardProps) => {
  const caseDetails = legalkartCase?.case_details || {};
  
  // Parse case numbers from array
  const caseNumbers = legalkartCase?.case_numbers || [];
  
  // Parse status/stage
  const statusStage = caseDetails['Status/Stage'] || legalkartCase?.status || 'N/A';
  const presentLastListed = caseDetails['Present/Last Listed On'] || 'N/A';

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Diary Number */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileText className="w-4 h-4" />
              <span>Diary Number</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {legalkartCase?.diary_number || 'N/A'}
            </div>
            {legalkartCase?.diary_filed_on && (
              <div className="text-xs text-muted-foreground mt-1">
                Filed: {format(new Date(legalkartCase.diary_filed_on), 'dd MMM yyyy')}
              </div>
            )}
          </div>

          {/* Case Numbers */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Scale className="w-4 h-4" />
              <span>Case Number(s)</span>
            </div>
            <div className="space-y-1">
              {caseNumbers.length > 0 ? (
                caseNumbers.map((cn: any, idx: number) => (
                  <div key={idx} className="text-sm font-medium">
                    {cn.number}
                    {cn.registered_on && (
                      <div className="text-xs text-muted-foreground">
                        Registered: {cn.registered_on}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-sm font-medium">{caseDetails['Case Number'] || 'N/A'}</span>
              )}
            </div>
          </div>

          {/* CNR & Category */}
          <div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">CNR Number</div>
                <div className="text-sm font-mono font-medium bg-white px-2 py-1 rounded border border-gray-200">
                  {legalkartCase?.cnr_number || caseDetails['CNR Number'] || 'N/A'}
                </div>
              </div>
              {caseDetails['Category'] && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <div className="text-xs font-medium line-clamp-2">
                    {caseDetails['Category']}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status & Last Listed */}
        <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Status/Stage</div>
            <Badge variant="outline" className="text-xs">
              {statusStage}
            </Badge>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              <span>Present/Last Listed On</span>
            </div>
            <div className="text-sm font-medium">
              {presentLastListed}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
