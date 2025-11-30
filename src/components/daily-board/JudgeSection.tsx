import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DailyHearing } from './types';
import { formatAdvocatesSmart } from './utils';
import { InlineEditRelief } from './InlineEditRelief';

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
                <TableCell className="font-medium text-gray-900">
                  {hearing.case_number || 'N/A'}
                </TableCell>
                <TableCell className="text-gray-900">{hearing.petitioner || '-'}</TableCell>
                <TableCell className="text-gray-900">{hearing.respondent || '-'}</TableCell>
                <TableCell className="text-sm text-gray-700">
                  {hearing.formatted_aorp || '-'}
                </TableCell>
                <TableCell className="text-sm text-gray-700">
                  {hearing.formatted_aorr || '-'}
                </TableCell>
                <TableCell className="text-sm text-gray-700 font-medium">
                  CBU
                </TableCell>
                <TableCell>
                  {hearing.purpose_of_hearing && (
                    <Badge variant={getStageColor(hearing.purpose_of_hearing)}>
                      {hearing.purpose_of_hearing}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <InlineEditRelief 
                    hearingId={hearing.hearing_id}
                    currentValue={hearing.relief}
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
