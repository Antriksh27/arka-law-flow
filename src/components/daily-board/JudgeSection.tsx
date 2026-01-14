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
  courtNumber?: string;
  benchType?: string;
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
  courtNumber,
  benchType = 'DB',
}) => {
  const queryClient = useQueryClient();
  
  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-board-hearings'] });
  };

  return (
    <div className="space-y-3">
      {/* Judge Header with Court Number Badge */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900 uppercase underline">{judgeName}</h3>
        {courtNumber && (
          <div className="flex gap-2">
            <div className="border-2 border-gray-800 px-4 py-2 text-center bg-white">
              <div className="font-bold text-base underline">{courtNumber}</div>
              <div className="text-xs font-medium">{benchType}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border border-gray-400 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-white border-b border-gray-400">
              <TableHead className="w-16 border-r border-gray-400 font-semibold text-black">Sr.No</TableHead>
              <TableHead className="w-36 border-r border-gray-400 font-semibold text-black">Case No</TableHead>
              <TableHead className="border-r border-gray-400 font-semibold text-black">NameofParties</TableHead>
              <TableHead className="w-20 border-r border-gray-400 font-semibold text-black">AORP</TableHead>
              <TableHead className="w-28 border-r border-gray-400 font-semibold text-black">AORR</TableHead>
              <TableHead className="w-32 font-semibold text-black">ArguingCouncil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hearings.map((hearing, index) => (
              <React.Fragment key={hearing.hearing_id}>
                {/* Main case row */}
                <TableRow className="border-b border-gray-400">
                  {/* Sr.No with DB indicator */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <div className="font-bold text-lg">{hearing.serial_number || startingSerialNo + index}</div>
                    <div className="text-xs font-medium">DB</div>
                  </TableCell>
                  
                  {/* Case Number */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <InlineEditField
                      id={hearing.case_id}
                      table="cases"
                      field="case_number"
                      currentValue={hearing.case_number}
                      onUpdate={handleUpdate}
                    />
                  </TableCell>
                  
                  {/* Name of Parties (Petitioner VS Respondent) */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <div className="space-y-1">
                      <InlineEditField
                        id={hearing.case_id}
                        table="cases"
                        field="petitioner"
                        currentValue={hearing.petitioner}
                        onUpdate={handleUpdate}
                      />
                      <div className="text-xs text-gray-500">VS</div>
                      <InlineEditField
                        id={hearing.case_id}
                        table="cases"
                        field="respondent"
                        currentValue={hearing.respondent}
                        onUpdate={handleUpdate}
                      />
                    </div>
                  </TableCell>
                  
                  {/* AORP */}
                  <TableCell className="border-r border-gray-400 align-top text-center">
                    <InlineEditField
                      id={hearing.case_id}
                      table="cases"
                      field="petitioner_advocate"
                      currentValue={hearing.formatted_aorp || hearing.petitioner_advocate}
                      onUpdate={handleUpdate}
                    />
                    <div className="text-xs text-gray-500">(Pet.1)</div>
                  </TableCell>
                  
                  {/* AORR */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <InlineEditField
                      id={hearing.case_id}
                      table="cases"
                      field="respondent_advocate"
                      currentValue={hearing.formatted_aorr || hearing.respondent_advocate}
                      onUpdate={handleUpdate}
                    />
                    <div className="text-xs text-gray-500">(Res.)</div>
                  </TableCell>
                  
                  {/* Arguing Council */}
                  <TableCell className="align-top">
                    <InlineEditField
                      id={hearing.hearing_id}
                      table="case_hearings"
                      field="coram"
                      currentValue={hearing.coram || 'CBU'}
                      onUpdate={handleUpdate}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Stage row */}
                <TableRow className="border-b border-gray-300">
                  <TableCell className="border-r border-gray-400 font-medium text-sm py-1">Stage</TableCell>
                  <TableCell colSpan={5} className="py-1">
                    <InlineEditField
                      id={hearing.hearing_id}
                      table="case_hearings"
                      field="purpose_of_hearing"
                      currentValue={hearing.purpose_of_hearing}
                      onUpdate={handleUpdate}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Relief row */}
                <TableRow className="border-b border-gray-300">
                  <TableCell className="border-r border-gray-400 font-medium text-sm py-1">Relief</TableCell>
                  <TableCell colSpan={5} className="py-1">
                    <InlineEditField
                      id={hearing.hearing_id}
                      table="case_hearings"
                      field="relief"
                      currentValue={hearing.relief}
                      onUpdate={handleUpdate}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Acts row */}
                <TableRow className="border-b border-gray-400 bg-gray-50">
                  <TableCell className="border-r border-gray-400 font-medium text-sm py-1">Acts</TableCell>
                  <TableCell colSpan={5} className="py-1 text-sm">
                    {hearing.acts && hearing.acts.length > 0 
                      ? hearing.acts.join(', ') 
                      : '-'}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
