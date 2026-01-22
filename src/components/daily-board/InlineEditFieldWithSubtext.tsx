import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DailyHearing } from './types';

interface InlineEditFieldWithSubtextProps {
  id: string;
  table: 'case_hearings' | 'cases';
  mainField: string;
  subField: string;
  mainValue: string | null;
  subValue: string | null;
  className?: string;
  mainPlaceholder?: string;
  subPlaceholder?: string;
}

export const InlineEditFieldWithSubtext: React.FC<InlineEditFieldWithSubtextProps> = ({
  id,
  table,
  mainField,
  subField,
  mainValue,
  subValue,
  className = '',
  mainPlaceholder = 'Main',
  subPlaceholder = 'Sub',
}) => {
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [localMain, setLocalMain] = useState(mainValue || '');
  const [localSub, setLocalSub] = useState(subValue || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveField = async (field: string, value: string | null, originalValue: string | null) => {
    // Optimistic update
    queryClient.setQueriesData<DailyHearing[]>(
      { queryKey: ['daily-hearings'] },
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(hearing => {
          const shouldUpdate = table === 'case_hearings'
            ? hearing.hearing_id === id
            : hearing.case_id === id;

          if (shouldUpdate) {
            return { ...hearing, [field]: value };
          }
          return hearing;
        });
      }
    );

    try {
      const { error } = await supabase
        .from(table)
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      // Revert on error
      queryClient.setQueriesData<DailyHearing[]>(
        { queryKey: ['daily-hearings'] },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(hearing => {
            const shouldUpdate = table === 'case_hearings'
              ? hearing.hearing_id === id
              : hearing.case_id === id;

            if (shouldUpdate) {
              return { ...hearing, [field]: originalValue };
            }
            return hearing;
          });
        }
      );
      toast({
        title: 'Error',
        description: 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMainSave = () => {
    saveField(mainField, localMain || null, mainValue);
    setIsEditingMain(false);
  };

  const handleSubSave = () => {
    saveField(subField, localSub || null, subValue);
    setIsEditingSub(false);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[40px] group ${className}`}>
      {/* Main text */}
      {isEditingMain ? (
        <input
          type="text"
          value={localMain}
          onChange={(e) => setLocalMain(e.target.value)}
          onBlur={handleMainSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleMainSave();
            if (e.key === 'Escape') {
              setLocalMain(mainValue || '');
              setIsEditingMain(false);
            }
          }}
          className="w-full text-center font-bold text-lg border-b border-blue-500 outline-none bg-transparent"
          autoFocus
          placeholder={mainPlaceholder}
        />
      ) : (
        <div
          onClick={() => setIsEditingMain(true)}
          className="font-bold text-lg cursor-pointer hover:bg-gray-100 px-1 rounded min-h-[24px] flex items-center"
        >
          {mainValue || <span className="text-gray-400 text-sm">{mainPlaceholder}</span>}
        </div>
      )}

      {/* Subtext */}
      {isEditingSub ? (
        <input
          type="text"
          value={localSub}
          onChange={(e) => setLocalSub(e.target.value)}
          onBlur={handleSubSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubSave();
            if (e.key === 'Escape') {
              setLocalSub(subValue || '');
              setIsEditingSub(false);
            }
          }}
          className="w-full text-center text-xs border-b border-blue-500 outline-none bg-transparent"
          autoFocus
          placeholder={subPlaceholder}
        />
      ) : (
        <div
          onClick={() => setIsEditingSub(true)}
          className="text-xs text-gray-500 cursor-pointer hover:bg-gray-100 px-1 rounded min-h-[16px] flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {subValue || <span className="text-gray-400">{subPlaceholder}</span>}
        </div>
      )}
    </div>
  );
};
