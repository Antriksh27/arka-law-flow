import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Scale, MapPin, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchLegalkartCaseId } from '../../legalkart/utils';
import { ParsedPartiesDisplay } from '../../legalkart/ParsedPartiesDisplay';

interface OverviewTabProps {
  caseData: any;
  caseId?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ caseData, caseId }) => {
  const [activeSubTab, setActiveSubTab] = useState('summary');

  // Fetch full legalkart data
  const { data: lkData } = useQuery({
    queryKey: ['legalkart-full-data', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const lkCaseId = await fetchLegalkartCaseId(caseId);
      if (!lkCaseId) return null;

      const { data } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('id', lkCaseId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!caseId
  });

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
      <TabsList className="bg-[#F9FAFB] p-1 rounded-xl">
        <TabsTrigger value="summary" className="rounded-lg">
          <FileText className="w-4 h-4 mr-2" />
          Summary
        </TabsTrigger>
        <TabsTrigger value="court" className="rounded-lg">
          <MapPin className="w-4 h-4 mr-2" />
          Court Details
        </TabsTrigger>
        <TabsTrigger value="parties" className="rounded-lg">
          <Scale className="w-4 h-4 mr-2" />
          Parties
        </TabsTrigger>
        <TabsTrigger value="additional" className="rounded-lg">
          <Info className="w-4 h-4 mr-2" />
          Additional Info
        </TabsTrigger>
      </TabsList>

      {/* Summary Tab */}
      <TabsContent value="summary">
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
                {(lkData?.filing_number || caseData.filing_number) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Filing Number</p>
                    <p className="font-medium text-[#111827]">
                      {lkData?.filing_number || caseData.filing_number}
                    </p>
                  </div>
                )}
                {(lkData?.registration_number || caseData.registration_number) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Registration Number</p>
                    <p className="font-medium text-[#111827]">
                      {lkData?.registration_number || caseData.registration_number}
                    </p>
                  </div>
                )}
                {(lkData?.cnr_number || caseData.cnr_number) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">CNR Number</p>
                    <p className="font-mono font-medium text-[#111827]">
                      {lkData?.cnr_number || caseData.cnr_number}
                    </p>
                  </div>
                )}
              </div>

              {/* Column 2: Dates */}
              <div className="space-y-4">
                {(lkData?.filing_date || caseData.filing_date) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Filing Date</p>
                    <p className="font-medium text-[#111827]">
                      {format(new Date(lkData?.filing_date || caseData.filing_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {(lkData?.registration_date || caseData.registration_date) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Registration Date</p>
                    <p className="font-medium text-[#111827]">
                      {format(new Date(lkData?.registration_date || caseData.registration_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {/* Column 3: Status */}
              <div className="space-y-4">
                {(lkData?.category || caseData.category) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Category</p>
                    <Badge variant="outline" className="font-medium">
                      {lkData?.category || caseData.category}
                    </Badge>
                  </div>
                )}
                {(lkData?.next_hearing_date || caseData.next_hearing_date) && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Next Hearing Date</p>
                    <Badge className="bg-[#1E3A8A] text-white px-3 py-1 rounded-full hover:bg-[#1E3A8A]">
                      <Calendar className="w-3 h-3 mr-1 inline" />
                      {format(new Date(lkData?.next_hearing_date || caseData.next_hearing_date), 'MMM d, yyyy')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Court Details Tab */}
      <TabsContent value="court">
        <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#1F2937]">
              <MapPin className="w-5 h-5" />
              Court Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lkData?.bench_type && (
                <div>
                  <p className="text-sm text-[#6B7280]">Bench Type</p>
                  <p className="font-medium text-[#111827]">{lkData.bench_type}</p>
                </div>
              )}
              {lkData?.judicial_branch && (
                <div>
                  <p className="text-sm text-[#6B7280]">Judicial Branch</p>
                  <p className="font-medium text-[#111827]">{lkData.judicial_branch}</p>
                </div>
              )}
              {lkData?.district && (
                <div>
                  <p className="text-sm text-[#6B7280]">District</p>
                  <p className="font-medium text-[#111827]">{lkData.district}</p>
                </div>
              )}
              {lkData?.state && (
                <div>
                  <p className="text-sm text-[#6B7280]">State</p>
                  <p className="font-medium text-[#111827]">{lkData.state}</p>
                </div>
              )}
              {lkData?.coram && (
                <div className="md:col-span-2">
                  <p className="text-sm text-[#6B7280]">Coram (Judge(s))</p>
                  <p className="font-medium text-[#111827]">{lkData.coram}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Parties Tab */}
      <TabsContent value="parties">
        <ParsedPartiesDisplay 
          petitionerString={lkData?.petitioner_and_advocate}
          respondentString={lkData?.respondent_and_advocate}
        />
      </TabsContent>

      {/* Additional Info Tab */}
      <TabsContent value="additional">
        <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#1F2937]">
              <Info className="w-5 h-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lkData?.stage_of_case && (
                <div>
                  <p className="text-sm text-[#6B7280]">Stage of Case</p>
                  <p className="font-medium text-[#111827]">{lkData.stage_of_case}</p>
                </div>
              )}
              {lkData?.sub_category && (
                <div>
                  <p className="text-sm text-[#6B7280]">Sub Category</p>
                  <p className="font-medium text-[#111827]">{lkData.sub_category}</p>
                </div>
              )}
              {lkData?.before_me_part_heard && (
                <div className="md:col-span-2">
                  <p className="text-sm text-[#6B7280]">Before Me / Part Heard</p>
                  <p className="font-medium text-[#111827]">{lkData.before_me_part_heard}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
