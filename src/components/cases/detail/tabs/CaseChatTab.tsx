import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseGroupChat } from '@/components/cases/chat/CaseGroupChat';
import { Skeleton } from '@/components/ui/skeleton';

interface CaseChatTabProps {
  caseId: string;
}

export const CaseChatTab: React.FC<CaseChatTabProps> = ({ caseId }) => {
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-for-chat', caseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cases')
        .select('petitioner, respondent, case_title')
        .eq('id', caseId)
        .single();
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-3/4" />
        <Skeleton className="h-32 w-3/4 ml-auto" />
        <Skeleton className="h-32 w-3/4" />
      </div>
    );
  }

  const caseName = caseData?.case_title || 
    `${caseData?.petitioner || ''} vs ${caseData?.respondent || ''}`;

  return (
    <div className="h-[calc(100vh-300px)] min-h-[500px]">
      <CaseGroupChat caseId={caseId} caseName={caseName} />
    </div>
  );
};
