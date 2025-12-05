import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DailyHearing } from './types';
import { InlineEditField } from './InlineEditField';
import { useQueryClient } from '@tanstack/react-query';

interface JudgeSectionProps {
  judgeName: string;
  hearings: DailyHearing[];
  startingSerialNo: number;
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

export const JudgeSection: React.FC<JudgeSectionProps> = ({
  judgeName,
  hearings,
  startingSerialNo,
}) => {
  const queryClient = useQueryClient();
  
  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-board-hearings'] });
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 px-4 py-3 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 uppercase">{judgeName}</h3>
      </div>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16">Sr. No.</TableHead>
              <TableHead className="w-32">Case No.</TableHead>
              <TableHead>Petitioner</TableHead>
              <TableHead>Respondent</TableHead>
              <TableHead>AORP</TableHead>
              <TableHead>AORR</TableHead>
              <TableHead>Arguing Counsel</TableHead>
              <TableHead className="w-32">Stage</TableHead>
              <TableHead>Relief</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hearings.map((hearing, index) => (
              <TableRow key={hearing.hearing_id}>
                <TableCell className="font-medium text-gray-600">
                  {startingSerialNo + index}
                </TableCell>
                <TableCell className="font-medium">
                  <InlineEditField
                    id={hearing.case_id}
                    table="cases"
                    field="case_number"
                    currentValue={hearing.case_number}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.case_id}
                    table="cases"
                    field="petitioner"
                    currentValue={hearing.petitioner}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.case_id}
                    table="cases"
                    field="respondent"
                    currentValue={hearing.respondent}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.case_id}
                    table="cases"
                    field="petitioner_advocate"
                    currentValue={hearing.formatted_aorp || hearing.petitioner_advocate}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.case_id}
                    table="cases"
                    field="respondent_advocate"
                    currentValue={hearing.formatted_aorr || hearing.respondent_advocate}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.hearing_id}
                    table="case_hearings"
                    field="coram"
                    currentValue={hearing.coram || 'CBU'}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.hearing_id}
                    table="case_hearings"
                    field="purpose_of_hearing"
                    currentValue={hearing.purpose_of_hearing}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditField
                    id={hearing.hearing_id}
                    table="case_hearings"
                    field="relief"
                    currentValue={hearing.relief}
                    onUpdate={handleUpdate}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
