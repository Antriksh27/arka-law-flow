import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DailyHearing } from './types';

interface InlineEditFieldWithSubtextProps {
  id: string;
  table: 'case_hearings' | 'cases';
  field: string; // Single field that stores "main|sub" format
  currentValue: string | null;
  className?: string;
  mainPlaceholder?: string;
  subPlaceholder?: string;
}

// Parse "main|sub" format
const parseValue = (value: string | null): { main: string; sub: string } => {
  if (!value) return { main: '', sub: '' };
  const parts = value.split('|');
  return { main: parts[0] || '', sub: parts[1] || '' };
};

// Combine to "main|sub" format (omit pipe if no sub)
const combineValue = (main: string, sub: string): string | null => {
  if (!main && !sub) return null;
  if (!sub) return main;
  return `${main}|${sub}`;
};

export const InlineEditFieldWithSubtext: React.FC<InlineEditFieldWithSubtextProps> = ({
  id,
  table,
  field,
  currentValue,
  className = '',
  mainPlaceholder = 'Main',
  subPlaceholder = 'Sub',
}) => {
  const parsed = parseValue(currentValue);
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [localMain, setLocalMain] = useState(parsed.main);
  const [localSub, setLocalSub] = useState(parsed.sub);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveField = async (newMain: string, newSub: string) => {
    const newValue = combineValue(newMain, newSub);
    
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
            return { ...hearing, [field]: newValue };
          }
          return hearing;
        });
      }
    );

    try {
      const { error } = await supabase
        .from(table)
        .update({ [field]: newValue })
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
              return { ...hearing, [field]: currentValue };
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
    saveField(localMain, localSub);
    setIsEditingMain(false);
  };

  const handleSubSave = () => {
    saveField(localMain, localSub);
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
              setLocalMain(parsed.main);
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
          {parsed.main || <span className="text-gray-400 text-sm">{mainPlaceholder}</span>}
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
              setLocalSub(parsed.sub);
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
          {parsed.sub || <span className="text-gray-400">{subPlaceholder}</span>}
        </div>
      )}
    </div>
  );
};
