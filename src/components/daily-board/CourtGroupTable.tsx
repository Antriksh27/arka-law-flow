import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JudgeSection } from './JudgeSection';
import { GroupedHearings, CourtBox, JudgeBoxesMap } from './types';

interface CourtGroupTableProps {
  courtGroup: GroupedHearings;
  judgeBoxes: JudgeBoxesMap;
  onJudgeBoxesChange: (judgeName: string, boxes: CourtBox[]) => void;
}

export const CourtGroupTable: React.FC<CourtGroupTableProps> = ({ 
  courtGroup, 
  judgeBoxes,
  onJudgeBoxesChange,
}) => {
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
            const defaultBoxes: CourtBox[] = [
              { main: judge.hearings[0]?.court_number || '', sub: judge.hearings[0]?.bench || '' }
            ];
            const boxes = judgeBoxes[judge.judgeName] || defaultBoxes;
            
            const section = (
              <JudgeSection
                key={judge.judgeName}
                judgeName={judge.judgeName}
                hearings={judge.hearings}
                startingSerialNo={serialNo}
                courtNumber={judge.courtNumber || String(100 + index)}
                benchType={judge.benchType || 'DB'}
                boxes={boxes}
                onBoxesChange={(newBoxes) => onJudgeBoxesChange(judge.judgeName, newBoxes)}
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
