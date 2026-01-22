import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DailyHearing, CourtBox } from './types';
import { InlineEditField } from './InlineEditField';
import { InlineEditFieldWithSubtext } from './InlineEditFieldWithSubtext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JudgeSectionProps {
  judgeName: string;
  hearings: DailyHearing[];
  startingSerialNo: number;
  courtNumber?: string;
  benchType?: string;
  boxes: CourtBox[];
  onBoxesChange: (boxes: CourtBox[]) => void;
}

// Editable text box with main text and subtext
const EditableTextBox: React.FC<{
  value: string;
  subtext: string;
  onChange: (val: string) => void;
  onSubtextChange: (val: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}> = ({ value, subtext, onChange, onSubtextChange, onRemove, showRemove }) => {
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [localSubtext, setLocalSubtext] = useState(subtext);

  return (
    <div className="border-2 border-gray-800 px-3 py-2 text-center bg-white min-w-[70px] relative group flex flex-col justify-center">
      {/* Main text */}
      {isEditingMain ? (
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => {
            onChange(localValue);
            setIsEditingMain(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(localValue);
              setIsEditingMain(false);
            }
            if (e.key === 'Escape') {
              setLocalValue(value);
              setIsEditingMain(false);
            }
          }}
          className="w-full text-center font-bold text-base border-b border-blue-500 outline-none bg-transparent"
          autoFocus
          placeholder="Main"
        />
      ) : (
        <div
          onClick={() => setIsEditingMain(true)}
          className="font-bold text-base cursor-pointer hover:bg-gray-100 min-h-[20px]"
        >
          {value || <span className="text-gray-400 text-xs">Main</span>}
        </div>
      )}
      
      {/* Subtext */}
      {isEditingSub ? (
        <input
          type="text"
          value={localSubtext}
          onChange={(e) => setLocalSubtext(e.target.value)}
          onBlur={() => {
            onSubtextChange(localSubtext);
            setIsEditingSub(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubtextChange(localSubtext);
              setIsEditingSub(false);
            }
            if (e.key === 'Escape') {
              setLocalSubtext(subtext);
              setIsEditingSub(false);
            }
          }}
          className="w-full text-center text-xs border-b border-blue-500 outline-none bg-transparent"
          autoFocus
          placeholder="Sub"
        />
      ) : (
        <div
          onClick={() => setIsEditingSub(true)}
          className="text-xs cursor-pointer hover:bg-gray-100 min-h-[14px] text-gray-600"
        >
          {subtext || <span className="text-gray-400">Sub</span>}
        </div>
      )}
      
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove box"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const JudgeSection: React.FC<JudgeSectionProps> = ({
  judgeName,
  hearings,
  startingSerialNo,
  courtNumber,
  benchType = 'DB',
  boxes,
  onBoxesChange,
}) => {
  const updateHearingField = async (hearingId: string, field: string, value: string | null) => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase
      .from('case_hearings')
      .update({ [field]: value })
      .eq('id', hearingId);
  };

  const addBox = () => {
    if (boxes.length < 5) {
      onBoxesChange([...boxes, { main: '', sub: '' }]);
    }
  };

  const removeBox = (index: number) => {
    if (boxes.length > 1) {
      onBoxesChange(boxes.filter((_, i) => i !== index));
    }
  };

  const updateBoxMain = (index: number, value: string) => {
    const newBoxes = [...boxes];
    newBoxes[index] = { ...newBoxes[index], main: value };
    onBoxesChange(newBoxes);
    
    // Update first hearing's court_number if it's the first box
    if (index === 0 && hearings[0]) {
      updateHearingField(hearings[0].hearing_id, 'court_number', value || null);
    }
  };

  const updateBoxSub = (index: number, value: string) => {
    const newBoxes = [...boxes];
    newBoxes[index] = { ...newBoxes[index], sub: value };
    onBoxesChange(newBoxes);
    
    // Update first hearing's bench if it's the first box
    if (index === 0 && hearings[0]) {
      updateHearingField(hearings[0].hearing_id, 'bench', value || null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Judge Header with Editable Court Number Boxes */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900 uppercase underline">{judgeName}</h3>
        {hearings.length > 0 && (
          <div className="flex gap-2 items-center">
            {/* Dynamic Court Number Boxes */}
            {boxes.map((box, index) => (
              <EditableTextBox
                key={index}
                value={box.main}
                subtext={box.sub}
                onChange={(val) => updateBoxMain(index, val)}
                onSubtextChange={(val) => updateBoxSub(index, val)}
                onRemove={() => removeBox(index)}
                showRemove={boxes.length > 1}
              />
            ))}
            
            {/* Add Box Button (max 5) */}
            {boxes.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addBox}
                className="h-[44px] w-[44px] p-0 border-2 border-dashed border-gray-400 hover:border-gray-600"
                title="Add box (max 5)"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            
            {/* Red Status Box */}
            <div className="border-2 border-red-400 w-[60px] h-[44px] bg-red-200"></div>
            
            {/* Yellow Status Box */}
            <div className="border-2 border-yellow-400 w-[60px] h-[44px] bg-yellow-200"></div>
            
            {/* Green Status Box */}
            <div className="border-2 border-green-400 w-[60px] h-[44px] bg-green-200"></div>
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
                  {/* Sr.No with editable serial number and subtext */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <InlineEditFieldWithSubtext
                      id={hearing.hearing_id}
                      table="case_hearings"
                      field="serial_number"
                      currentValue={hearing.serial_number}
                      mainPlaceholder="#"
                      subPlaceholder="sub"
                    />
                  </TableCell>
                  
                  {/* Case Number */}
                  <TableCell className="border-r border-gray-400 align-top">
                    <InlineEditField
                      id={hearing.case_id}
                      table="cases"
                      field="case_number"
                      currentValue={hearing.case_number}
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
                      />
                      <div className="text-xs text-gray-500">VS</div>
                      <InlineEditField
                        id={hearing.case_id}
                        table="cases"
                        field="respondent"
                        currentValue={hearing.respondent}
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
