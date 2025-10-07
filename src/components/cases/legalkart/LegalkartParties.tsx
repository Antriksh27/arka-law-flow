import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LegalkartPartiesProps {
  caseId: string;
}

const fetchCaseInfo = async (caseId: string) => {
  try {
    const { fetchLegalkartCaseId } = await import('./utils');
    const lkCaseId = await fetchLegalkartCaseId(caseId);
    if (!lkCaseId) return null;

    const { data, error } = await supabase
      .from('legalkart_cases')
      .select('petitioner_and_advocate, respondent_and_advocate')
      .eq('id', lkCaseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching parties:', error);
    return null;
  }
};

export const LegalkartParties: React.FC<LegalkartPartiesProps> = ({ caseId }) => {
  const { data: parties, isLoading } = useQuery({
    queryKey: ['legalkart-parties', caseId],
    queryFn: () => fetchCaseInfo(caseId),
    enabled: !!caseId
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-xl"></div>
        <div className="h-32 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!parties) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No party information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Petitioners and Advocates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Petitioner(s) & Advocate(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {parties.petitioner_and_advocate ? (
            <div>
              <div className="flex items-start gap-3">
                <Badge variant="default">Petitioner Side</Badge>
              </div>
              <div className="mt-3 pl-6 border-l-2 border-muted">
                <p className="font-medium whitespace-pre-line">{parties.petitioner_and_advocate}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No petitioner information available</p>
          )}
        </CardContent>
      </Card>

      {/* Respondents and Advocates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Respondent(s) & Advocate(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {parties.respondent_and_advocate ? (
            <div>
              <div className="flex items-start gap-3">
                <Badge variant="outline">Respondent Side</Badge>
              </div>
              <div className="mt-3 pl-6 border-l-2 border-muted">
                <p className="font-medium whitespace-pre-line">{parties.respondent_and_advocate}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No respondent information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
