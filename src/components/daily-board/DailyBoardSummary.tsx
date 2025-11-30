import React from 'react';
import { Badge } from '@/components/ui/badge';
import { GroupedHearings } from './types';

interface DailyBoardSummaryProps {
  groupedHearings: GroupedHearings[];
  totalCount: number;
}

export const DailyBoardSummary: React.FC<DailyBoardSummaryProps> = ({
  groupedHearings,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex flex-wrap gap-3">
        <Badge variant="default" className="text-sm px-4 py-2">
          {totalCount} Hearings Today
        </Badge>
        
        {groupedHearings.map((court) => {
          const courtTotal = court.judges.reduce((sum, judge) => sum + judge.hearings.length, 0);
          return (
            <Badge key={court.courtName} variant="outline" className="text-sm px-4 py-2">
              {courtTotal} in {court.courtName}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
