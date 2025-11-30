import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DailyHearing } from './types';
import { formatAdvocatesSmart } from './utils';
import { InlineEditRelief } from './InlineEditRelief';

interface HearingCardProps {
  hearing: DailyHearing;
  serialNo: number;
}

const getStageColor = (stage: string | null) => {
  if (!stage) return 'default';
  const stageLower = stage.toLowerCase();
  
  if (stageLower.includes('admission')) return 'active';
  if (stageLower.includes('notice')) return 'warning';
  if (stageLower.includes('order') || stageLower.includes('direction')) return 'error';
  if (stageLower.includes('final')) return 'success';
  
  return 'default';
};

export const HearingCard: React.FC<HearingCardProps> = ({ hearing, serialNo }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">#{serialNo}</span>
            <span className="text-sm font-semibold text-gray-900">{hearing.case_number || 'N/A'}</span>
            {hearing.purpose_of_hearing && (
              <Badge variant={getStageColor(hearing.purpose_of_hearing)} className="text-xs">
                {hearing.purpose_of_hearing}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Parties</p>
          <p className="text-sm text-gray-900">
            <span className="font-medium">{hearing.petitioner || 'N/A'}</span>
            <span className="mx-2 text-gray-400">vs</span>
            <span className="font-medium">{hearing.respondent || 'N/A'}</span>
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Lawyers</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">AORP:</span> {formatAdvocatesSmart(hearing.petitioner_advocate, 'petitioner')}
            </p>
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">AORR:</span> {formatAdvocatesSmart(hearing.respondent_advocate, 'respondent')}
            </p>
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Arguing:</span> <span className="font-medium">CBU</span>
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Relief</p>
          <InlineEditRelief 
            hearingId={hearing.hearing_id}
            currentValue={hearing.relief}
          />
        </div>
      </div>
    </div>
  );
};
