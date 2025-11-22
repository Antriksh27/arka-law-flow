import { Card, CardContent } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import { format } from 'date-fns';

interface SCDiaryBenchCardProps {
  caseData: any;
  legalkartCase: any;
}

export const SCDiaryBenchCard = ({ caseData, legalkartCase }: SCDiaryBenchCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Diary Number</div>
            <div className="text-2xl font-bold text-primary">
              {legalkartCase?.diary_number || 'N/A'}
            </div>
            {legalkartCase?.diary_filed_on && (
              <div className="text-xs text-muted-foreground mt-1">
                Filed: {format(new Date(legalkartCase.diary_filed_on), 'dd MMM yyyy')}
              </div>
            )}
            {legalkartCase?.diary_section && (
              <div className="text-xs text-muted-foreground">
                Section: {legalkartCase.diary_section}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Bench Composition</div>
            <div className="space-y-1">
              {legalkartCase?.bench_composition?.map((judge: string, idx: number) => (
                <div key={idx} className="text-sm font-medium text-foreground flex items-center">
                  <Scale className="w-3 h-3 mr-2 text-primary" />
                  {judge}
                </div>
              )) || <span className="text-muted-foreground">Not available</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
