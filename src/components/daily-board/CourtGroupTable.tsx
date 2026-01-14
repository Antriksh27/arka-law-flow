import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JudgeSection } from './JudgeSection';
import { GroupedHearings } from './types';

interface CourtGroupTableProps {
  courtGroup: GroupedHearings;
}

export const CourtGroupTable: React.FC<CourtGroupTableProps> = ({ courtGroup }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  let serialNo = 1;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-primary/10 px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
          {courtGroup.courtName}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-6 space-y-6">
          {courtGroup.judges.map((judge, index) => {
            const section = (
              <JudgeSection
                key={judge.judgeName}
                judgeName={judge.judgeName}
                hearings={judge.hearings}
                startingSerialNo={serialNo}
                courtNumber={judge.courtNumber || String(100 + index)}
                benchType={judge.benchType || 'DB'}
              />
            );
            serialNo += judge.hearings.length;
            return section;
          })}
        </div>
      )}
    </div>
  );
};
