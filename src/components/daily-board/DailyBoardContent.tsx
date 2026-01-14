import React from 'react';
import { CourtGroupTable } from './CourtGroupTable';
import { HearingCard } from './HearingCard';
import { GroupedHearings } from './types';
import { useIsMobile } from '@/hooks/use-mobile';

interface DailyBoardContentProps {
  groupedHearings: GroupedHearings[];
}

export const DailyBoardContent: React.FC<DailyBoardContentProps> = ({
  groupedHearings,
}) => {
  const isMobile = useIsMobile();
  
  if (groupedHearings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <p className="text-gray-500">No hearings scheduled for this date.</p>
      </div>
    );
  }
  
  if (isMobile) {
    return (
      <div className="space-y-6">
        {groupedHearings.map((courtGroup) => (
          <div key={courtGroup.courtName} className="space-y-4">
            <div className="sticky top-0 z-10 bg-primary/10 px-4 py-3 rounded-lg">
              <h2 className="text-lg font-bold text-gray-900 uppercase">
                {courtGroup.courtName}
              </h2>
            </div>
            
            {courtGroup.judges.map((judge) => (
              <div key={judge.judgeName} className="space-y-3">
                <div className="sticky top-14 z-10 bg-gray-50 px-4 py-2 rounded-lg">
                  <h3 className="text-base font-semibold text-gray-900 uppercase">
                    {judge.judgeName}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {judge.hearings.map((hearing) => (
                    <HearingCard
                      key={hearing.hearing_id}
                      hearing={hearing}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {groupedHearings.map((courtGroup) => (
        <CourtGroupTable key={courtGroup.courtName} courtGroup={courtGroup} />
      ))}
    </div>
  );
};
