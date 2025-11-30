import React from 'react';
import { DailyHearing } from './types';
import { Badge } from '@/components/ui/badge';
import { Scale, User, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDailyBoardCardProps {
  hearing: DailyHearing;
  index: number;
}

export const MobileDailyBoardCard: React.FC<MobileDailyBoardCardProps> = ({
  hearing,
  index,
}) => {
  const getStageColor = (stage: string | null) => {
    switch (stage?.toLowerCase()) {
      case 'admission':
        return 'bg-blue-100 text-blue-800';
      case 'notice':
        return 'bg-amber-100 text-amber-800';
      case 'orders':
        return 'bg-red-100 text-red-800';
      case 'final hearing':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border-l-4 border-l-primary shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
            {index}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {hearing.case_number || 'No case number'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {hearing.case_title}
            </p>
          </div>
        </div>
        {hearing.status && (
          <Badge className={cn("text-xs", getStageColor(hearing.status))}>
            {hearing.status}
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Scale className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground">Parties</p>
            <p className="font-medium truncate">{hearing.petitioner || 'N/A'}</p>
            <p className="text-muted-foreground">vs</p>
            <p className="font-medium truncate">{hearing.respondent || 'N/A'}</p>
          </div>
        </div>

        {hearing.formatted_aorp && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground">AORP</p>
              <p className="font-medium">{hearing.formatted_aorp}</p>
            </div>
          </div>
        )}

        {hearing.formatted_aorr && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground">AORR</p>
              <p className="font-medium">{hearing.formatted_aorr}</p>
            </div>
          </div>
        )}

        {hearing.relief && (
          <div className="flex items-start gap-2">
            <Gavel className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground">Relief</p>
              <p className="font-medium">{hearing.relief}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
