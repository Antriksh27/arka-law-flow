import React, { useState } from 'react';
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

// Editable Box Component for court numbers
const EditableCourtBox: React.FC<{
  courtNum: string;
  benchType: string;
  onCourtNumChange: (val: string) => void;
  onBenchTypeChange: (val: string) => void;
}> = ({ courtNum, benchType, onCourtNumChange, onBenchTypeChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(courtNum);

  return (
    <div className="border-2 border-gray-800 px-4 py-2 text-center bg-white min-w-[60px]">
      {isEditing ? (
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => {
            onCourtNumChange(localValue);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCourtNumChange(localValue);
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              setLocalValue(courtNum);
              setIsEditing(false);
            }
          }}
          className="w-full text-center font-bold text-base border-b border-blue-500 outline-none bg-transparent"
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="font-bold text-base cursor-pointer hover:bg-gray-100 min-h-[20px]"
        >
          {courtNum || ''}
        </div>
      )}
      <select
        className="text-xs text-center bg-transparent border-none outline-none cursor-pointer w-full"
        value={benchType}
        onChange={(e) => onBenchTypeChange(e.target.value)}
        title="DB = Daily Board, SB = Supplementary Board"
      >
        <option value="">-</option>
        <option value="DB">DB</option>
        <option value="SB">SB</option>
      </select>
    </div>
  );
};

export const JudgeSection: React.FC<JudgeSectionProps> = ({
  judgeName,
  hearings,
  startingSerialNo,
  courtNumber,
  benchType = 'DB',
}) => {
  const queryClient = useQueryClient();
  
  // Local state for the 3 court boxes (stored per judge section)
  const [box1, setBox1] = useState({ court: hearings[0]?.court_number || '', bench: hearings[0]?.bench || '' });
  const [box2, setBox2] = useState({ court: '', bench: '' });
  const [box3, setBox3] = useState({ court: '', bench: '' });
  
  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-board-hearings'] });
  };

  const updateHearingField = async (hearingId: string, field: string, value: string | null) => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase
      .from('case_hearings')
      .update({ [field]: value })
      .eq('id', hearingId);
    handleUpdate();
  };

  return (
    <div className="space-y-3">
      {/* Judge Header with Editable Court Number Boxes */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900 uppercase underline">{judgeName}</h3>
        {hearings.length > 0 && (
          <div className="flex gap-2">
            {/* Court Number Box 1 */}
            <EditableCourtBox
              courtNum={box1.court}
              benchType={box1.bench}
              onCourtNumChange={(val) => {
                setBox1(prev => ({ ...prev, court: val }));
                updateHearingField(hearings[0].hearing_id, 'court_number', val || null);
              }}
              onBenchTypeChange={(val) => {
                setBox1(prev => ({ ...prev, bench: val }));
                updateHearingField(hearings[0].hearing_id, 'bench', val || null);
              }}
            />
            
            {/* Court Number Box 2 */}
            <EditableCourtBox
              courtNum={box2.court}
              benchType={box2.bench}
              onCourtNumChange={(val) => setBox2(prev => ({ ...prev, court: val }))}
              onBenchTypeChange={(val) => setBox2(prev => ({ ...prev, bench: val }))}
            />
            
            {/* Court Number Box 3 */}
            <EditableCourtBox
              courtNum={box3.court}
              benchType={box3.bench}
              onCourtNumChange={(val) => setBox3(prev => ({ ...prev, court: val }))}
              onBenchTypeChange={(val) => setBox3(prev => ({ ...prev, bench: val }))}
            />
            
            {/* Red Status Box */}
            <div className="border-2 border-red-400 w-[60px] h-[52px] bg-red-200"></div>
            
            {/* Yellow Status Box */}
            <div className="border-2 border-yellow-400 w-[60px] h-[52px] bg-yellow-200"></div>
            
            {/* Green Status Box */}
            <div className="border-2 border-green-400 w-[60px] h-[52px] bg-green-200"></div>
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
                  {/* Sr.No with editable serial number and bench type - blank unless edited */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <InlineEditField
                      id={hearing.hearing_id}
                      table="case_hearings"
                      field="serial_number"
                      currentValue={hearing.serial_number || ''}
                      onUpdate={handleUpdate}
                      placeholder=""
                      className="font-bold text-lg"
                    />
                    <select
                      className="text-xs bg-transparent border-none outline-none cursor-pointer"
                      value={hearing.bench || ''}
                      onChange={(e) => updateHearingField(hearing.hearing_id, 'bench', e.target.value || null)}
                      title="DB = Daily Board, SB = Supplementary Board"
                    >
                      <option value="">-</option>
                      <option value="DB">DB</option>
                      <option value="SB">SB</option>
                    </select>
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
