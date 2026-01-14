import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DailyHearing } from './types';
import { InlineEditField } from './InlineEditField';
import { useQueryClient } from '@tanstack/react-query';

interface HearingCardProps {
  hearing: DailyHearing;
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

export const HearingCard: React.FC<HearingCardProps> = ({ hearing }) => {
  const queryClient = useQueryClient();
  
  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-board-hearings'] });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">#</span>
            <InlineEditField
              id={hearing.hearing_id}
              table="case_hearings"
              field="serial_number"
              currentValue={hearing.serial_number}
              onUpdate={handleUpdate}
              placeholder=""
              className="w-10"
            />
            <InlineEditField
              id={hearing.case_id}
              table="cases"
              field="case_number"
              currentValue={hearing.case_number}
              onUpdate={handleUpdate}
              className="font-semibold"
            />
            <InlineEditField
              id={hearing.case_id}
              table="cases"
              field="case_number"
              currentValue={hearing.case_number}
              onUpdate={handleUpdate}
              className="font-semibold"
            />
          </div>
          <div className="mt-1">
            <InlineEditField
              id={hearing.hearing_id}
              table="case_hearings"
              field="purpose_of_hearing"
              currentValue={hearing.purpose_of_hearing}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Petitioner</p>
          <InlineEditField
            id={hearing.case_id}
            table="cases"
            field="petitioner"
            currentValue={hearing.petitioner}
            onUpdate={handleUpdate}
          />
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Respondent</p>
          <InlineEditField
            id={hearing.case_id}
            table="cases"
            field="respondent"
            currentValue={hearing.respondent}
            onUpdate={handleUpdate}
          />
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Lawyers</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-12">AORP:</span>
              <InlineEditField
                id={hearing.case_id}
                table="cases"
                field="petitioner_advocate"
                currentValue={hearing.formatted_aorp || hearing.petitioner_advocate}
                onUpdate={handleUpdate}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-12">AORR:</span>
              <InlineEditField
                id={hearing.case_id}
                table="cases"
                field="respondent_advocate"
                currentValue={hearing.formatted_aorr || hearing.respondent_advocate}
                onUpdate={handleUpdate}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 w-12">Arguing:</span>
              <InlineEditField
                id={hearing.hearing_id}
                table="case_hearings"
                field="coram"
                currentValue={hearing.coram || 'CBU'}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Relief</p>
          <InlineEditField 
            id={hearing.hearing_id}
            table="case_hearings"
            field="relief"
            currentValue={hearing.relief}
            onUpdate={handleUpdate}
          />
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Acts</p>
          <span className="text-sm text-gray-700">
            {hearing.acts && hearing.acts.length > 0 
              ? hearing.acts.join(', ') 
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
