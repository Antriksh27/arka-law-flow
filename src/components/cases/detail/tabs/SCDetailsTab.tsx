import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, File, Scale, Calendar, Bell, AlertTriangle, FileText, Briefcase } from 'lucide-react';
import { SCCaseHeaderCard } from '@/components/cases/supreme/SCCaseHeaderCard';
import { SCBenchAdvocatesCard } from '@/components/cases/supreme/SCBenchAdvocatesCard';
import { SCEarlierCourtsTable } from '@/components/cases/supreme/SCEarlierCourtsTable';
import { SCTaggedMattersTable } from '@/components/cases/supreme/SCTaggedMattersTable';
import { SCListingHistoryTimeline } from '@/components/cases/supreme/SCListingHistoryTimeline';
import { SCNoticesTable } from '@/components/cases/supreme/SCNoticesTable';
import { SCDefectsTable } from '@/components/cases/supreme/SCDefectsTable';
import { SCJudgementOrdersTable } from '@/components/cases/supreme/SCJudgementOrdersTable';
import { SCOfficeReportsTable } from '@/components/cases/supreme/SCOfficeReportsTable';

interface SCDetailsTabProps {
  caseId: string;
  caseData: any;
  legalkartCase: any;
  petitioners: any[];
  respondents: any[];
}

export const SCDetailsTab: React.FC<SCDetailsTabProps> = ({
  caseId,
  caseData,
  legalkartCase,
  petitioners,
  respondents
}) => {
  const [nestedTab, setNestedTab] = useState('parties');

  const caseDetails = legalkartCase?.case_details || {};

  const nestedTabs = [
    { value: 'parties', label: 'Parties', icon: Users },
    { value: 'earlier-courts', label: 'Earlier Courts', icon: Scale },
    { value: 'tagged-matters', label: 'Tagged Matters', icon: Briefcase },
    { value: 'listing-history', label: 'Listing History', icon: Calendar },
    { value: 'notices', label: 'Notices', icon: Bell },
    { value: 'defects', label: 'Defects', icon: AlertTriangle },
    { value: 'judgements', label: 'Judgement Orders', icon: FileText },
    { value: 'office-reports', label: 'Office Reports', icon: File },
  ];

  // Helper to parse party names
  const parseName = (text: string) => {
    if (!text) return '';
    return text.trim();
  };

  return (
    <div className="space-y-6">
      {/* SC Case Header */}
      <SCCaseHeaderCard legalkartCase={legalkartCase} />

      {/* Bench & Advocates */}
      <SCBenchAdvocatesCard legalkartCase={legalkartCase} />

      {/* Nested Tabs for SC-specific data */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={nestedTab} onValueChange={setNestedTab} className="w-full">
            <TabsList className="w-full bg-gray-50 border-b border-gray-200 h-auto p-0 rounded-none">
              <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
                {nestedTabs.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors"
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </div>
            </TabsList>

            <div className="p-6">
              {/* Parties Tab */}
              <TabsContent value="parties" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Petitioners */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Petitioner(s)
                    </h4>
                    {petitioners && petitioners.length > 0 ? (
                      <div className="space-y-3">
                        {petitioners.map((petitioner, index) => (
                          <div key={index} className="border-l-2 border-blue-500 pl-3">
                            <p className="text-sm font-medium text-gray-900">
                              {index + 1}. {parseName(petitioner.petitioner_name || petitioner.name)}
                            </p>
                            {petitioner.advocate_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                Advocate: {petitioner.advocate_name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : caseDetails['Petitioner(s)'] ? (
                      <div className="border-l-2 border-blue-500 pl-3">
                        <p className="text-sm font-medium whitespace-pre-line">
                          {caseDetails['Petitioner(s)']}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No petitioners listed</p>
                    )}
                  </div>

                  {/* Respondents */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Respondent(s)
                    </h4>
                    {respondents && respondents.length > 0 ? (
                      <div className="space-y-3">
                        {respondents.map((respondent, index) => (
                          <div key={index} className="border-l-2 border-red-500 pl-3">
                            <p className="text-sm font-medium text-gray-900">
                              {index + 1}. {parseName(respondent.respondent_name || respondent.name)}
                            </p>
                            {respondent.advocate_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                Advocate: {respondent.advocate_name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : caseDetails['Respondent(s)'] ? (
                      <div className="border-l-2 border-red-500 pl-3">
                        <p className="text-sm font-medium whitespace-pre-line">
                          {caseDetails['Respondent(s)']}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No respondents listed</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Earlier Courts Tab */}
              <TabsContent value="earlier-courts" className="m-0">
                <SCEarlierCourtsTable caseId={caseId} />
              </TabsContent>

              {/* Tagged Matters Tab */}
              <TabsContent value="tagged-matters" className="m-0">
                <SCTaggedMattersTable caseId={caseId} />
              </TabsContent>

              {/* Listing History Tab */}
              <TabsContent value="listing-history" className="m-0">
                <SCListingHistoryTimeline caseId={caseId} />
              </TabsContent>

              {/* Notices Tab */}
              <TabsContent value="notices" className="m-0">
                <SCNoticesTable caseId={caseId} />
              </TabsContent>

              {/* Defects Tab */}
              <TabsContent value="defects" className="m-0">
                <SCDefectsTable caseId={caseId} />
              </TabsContent>

              {/* Judgement Orders Tab */}
              <TabsContent value="judgements" className="m-0">
                <SCJudgementOrdersTable caseId={caseId} />
              </TabsContent>

              {/* Office Reports Tab */}
              <TabsContent value="office-reports" className="m-0">
                <SCOfficeReportsTable caseId={caseId} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
