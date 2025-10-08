import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Scale, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchLegalkartCaseId } from '../../legalkart/utils';

interface OverviewTabProps {
  caseData: any;
  caseId?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ caseData, caseId }) => {
  // Fetch parties data from legalkart_cases
  const { data: parties } = useQuery({
    queryKey: ['legalkart-parties', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      
      const lkCaseId = await fetchLegalkartCaseId(caseId);
      if (!lkCaseId) return null;

      const { data } = await supabase
        .from('legalkart_cases')
        .select('petitioner_and_advocate, respondent_and_advocate')
        .eq('id', lkCaseId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!caseId
  });

  return (
    <div className="space-y-6">
      {/* Case Summary Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#1F2937]">
            <FileText className="w-5 h-5" />
            Case Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Numbers */}
            <div className="space-y-4">
              {caseData.filing_number && (
                <div>
                  <p className="text-sm text-[#6B7280]">Filing Number</p>
                  <p className="font-medium text-[#111827]">{caseData.filing_number}</p>
                </div>
              )}
              {caseData.registration_number && (
                <div>
                  <p className="text-sm text-[#6B7280]">Registration Number</p>
                  <p className="font-medium text-[#111827]">{caseData.registration_number}</p>
                </div>
              )}
              {caseData.cnr_number && (
                <div>
                  <p className="text-sm text-[#6B7280]">CNR Number</p>
                  <p className="font-medium text-[#111827]">{caseData.cnr_number}</p>
                </div>
              )}
            </div>

            {/* Column 2: Dates & Category */}
            <div className="space-y-4">
              {caseData.filing_date && (
                <div>
                  <p className="text-sm text-[#6B7280]">Filing Date</p>
                  <p className="font-medium text-[#111827]">
                    {format(new Date(caseData.filing_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              {caseData.registration_date && (
                <div>
                  <p className="text-sm text-[#6B7280]">Registration Date</p>
                  <p className="font-medium text-[#111827]">
                    {format(new Date(caseData.registration_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              {caseData.category && (
                <div>
                  <p className="text-sm text-[#6B7280]">Category</p>
                  <p className="font-medium text-[#111827]">{caseData.category}</p>
                </div>
              )}
            </div>

            {/* Column 3: Stage & Next Hearing */}
            <div className="space-y-4">
              {caseData.stage && (
                <div>
                  <p className="text-sm text-[#6B7280]">Current Stage</p>
                  <p className="font-medium text-[#111827]">{caseData.stage}</p>
                </div>
              )}
              {caseData.next_hearing_date && (
                <div>
                  <p className="text-sm text-[#6B7280]">Next Hearing Date</p>
                  <Badge className="bg-[#1E3A8A] text-white px-3 py-1 rounded-full hover:bg-[#1E3A8A]">
                    <Calendar className="w-3 h-3 mr-1 inline" />
                    {format(new Date(caseData.next_hearing_date), 'MMM d, yyyy')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties Section - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Petitioners */}
        <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#1F2937]">
              <Users className="w-5 h-5 text-[#1E3A8A]" />
              Petitioner(s) & Advocate(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {parties?.petitioner_and_advocate ? (
              <div className="pl-4 border-l-4 border-[#1E3A8A]">
                <p className="font-medium text-[#111827] whitespace-pre-line leading-relaxed">
                  {parties.petitioner_and_advocate}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] italic">No petitioner information available</p>
            )}
          </CardContent>
        </Card>

        {/* Respondents */}
        <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#1F2937]">
              <Scale className="w-5 h-5 text-[#1E3A8A]" />
              Respondent(s) & Advocate(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {parties?.respondent_and_advocate ? (
              <div className="pl-4 border-l-4 border-[#E5E7EB]">
                <p className="font-medium text-[#111827] whitespace-pre-line leading-relaxed">
                  {parties.respondent_and_advocate}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] italic">No respondent information available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
