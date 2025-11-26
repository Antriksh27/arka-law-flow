import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale } from 'lucide-react';

interface SCDiaryBenchCardProps {
  diaryNumber?: string | null;
  benchComposition?: string | null;
  caseTitle?: string | null;
  caseNumber?: string | string[] | null;
}

export function SCDiaryBenchCard({ 
  diaryNumber, 
  benchComposition,
  caseTitle,
  caseNumber 
}: SCDiaryBenchCardProps) {
  // Handle array case number
  const displayCaseNumber = Array.isArray(caseNumber) ? caseNumber[0] : caseNumber;
  
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Scale className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {caseTitle || 'Supreme Court Case'}
              </h2>
              {displayCaseNumber && (
                <p className="text-sm text-muted-foreground mt-1">{displayCaseNumber}</p>
              )}
            </div>
            
            {diaryNumber && (
              <Badge variant="outline" className="text-base px-4 py-2">
                Diary No: {diaryNumber}
              </Badge>
            )}
          </div>
          
          {benchComposition && (
            <div className="flex items-start gap-2 pt-2 border-t border-border/50">
              <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                Bench:
              </span>
              <p className="text-sm text-foreground">{benchComposition}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}