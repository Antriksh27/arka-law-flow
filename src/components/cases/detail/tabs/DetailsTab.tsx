import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, FileText, Users, AlertCircle, File, Scale, Calendar, XCircle, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay, formatAdvocateName, formatPartyName } from '@/lib/caseDataFormatter';
import { DocumentsTable } from '@/components/cases/enhanced/DocumentsTable';
import { OrdersTable } from '@/components/cases/enhanced/OrdersTable';
import { HearingsTable } from '@/components/cases/enhanced/HearingsTable';
import { ObjectionsTable } from '@/components/cases/enhanced/ObjectionsTable';
import { IADetailsTable } from '@/components/cases/enhanced/IADetailsTable';
import { InlineEditReferenceActs } from '@/components/cases/detail/InlineEditReferenceActs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DetailsTabProps {
  caseData: any;
  legalkartData: any;
  petitioners: any[];
  respondents: any[];
  iaDetails: any[];
  documents: any[];
  orders: any[];
  hearings: any[];
  objections: any[];
}

interface CaseInfoItem {
  label: string;
  value: any;
  isEditable?: boolean;
  editComponent?: React.ReactNode;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  caseData,
  legalkartData,
  petitioners,
  respondents,
  iaDetails,
  documents,
  orders,
  hearings,
  objections
}) => {
  const [caseInfoOpen, setCaseInfoOpen] = useState(true);
  const [nestedTab, setNestedTab] = useState('parties');
  const isMobile = useIsMobile();
  
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return formatDateDisplay(date);
  };
  const parseName = (text: string) => {
    if (!text) return '';
    return formatPartyName(text);
  };
  const parseAdvocates = (text: string) => {
    if (!text) return '';
    return formatAdvocateName(text);
  };

  const nestedTabs = [
    { value: 'parties', label: 'Parties', icon: Users, color: 'bg-sky-50 text-sky-500' },
    { value: 'documents', label: 'Docs', icon: File, color: 'bg-violet-50 text-violet-500' },
    { value: 'orders', label: 'Orders', icon: Scale, color: 'bg-emerald-50 text-emerald-500' },
    { value: 'hearings', label: 'Hearings', icon: Calendar, color: 'bg-amber-50 text-amber-500' },
    { value: 'objections', label: 'Objections', icon: XCircle, color: 'bg-rose-50 text-rose-500' },
    { value: 'ia-details', label: 'IA', icon: CheckSquare, color: 'bg-slate-100 text-slate-500' },
  ];

  const caseInfoItems = [
    { label: 'Filing Number', value: legalkartData?.filing_number || caseData?.filing_number },
    { label: 'Filing Date', value: formatDate(legalkartData?.filing_date || caseData?.filing_date) },
    { label: 'Registration Number', value: legalkartData?.registration_number || caseData?.registration_number },
    { label: 'Registration Date', value: formatDate(legalkartData?.registration_date || caseData?.registration_date) },
    { label: 'CNR Number', value: legalkartData?.cnr_number || caseData?.cnr_number },
    { label: 'Case Type', value: legalkartData?.case_type || caseData?.case_type },
    { label: 'Stage of Case', value: legalkartData?.stage_of_case || caseData?.stage },
    { label: 'First Hearing Date', value: formatDate(legalkartData?.first_hearing_date || caseData?.first_hearing_date) },
    { label: 'Next Hearing Date', value: formatDate(legalkartData?.next_hearing_date || caseData?.next_hearing_date) },
    { label: 'Court Number & Judge', value: legalkartData?.court_number_and_judge },
    ...((caseData?.status === 'disposed' || legalkartData?.status === 'disposed') ? [
      { label: 'Case Status', value: 'CASE DISPOSED' },
      { label: 'Decision Date', value: formatDate(legalkartData?.decision_date || caseData?.decision_date) },
      { label: 'Disposal Date', value: formatDate(legalkartData?.disposal_date || caseData?.disposal_date) },
      { label: 'Nature of Disposal', value: legalkartData?.description || caseData?.description }
    ] : []),
    { label: 'Coram', value: legalkartData?.coram || caseData?.coram },
    { label: 'Bench Type', value: legalkartData?.bench_type || caseData?.bench_type },
    { label: 'Judicial Branch', value: legalkartData?.judicial_branch || caseData?.judicial_branch },
    { label: 'State', value: legalkartData?.state || caseData?.state },
    { label: 'District', value: legalkartData?.district || caseData?.district },
    { label: 'Court Name', value: caseData?.court_name },
    { label: 'Category', value: legalkartData?.category || caseData?.category },
    { label: 'Sub-Category', value: legalkartData?.sub_category || caseData?.sub_category },
    { 
      label: 'Reference Acts', 
      value: true, 
      isEditable: true, 
      editComponent: <InlineEditReferenceActs caseId={caseData.id} currentActs={caseData?.acts || []} /> 
    }
  ].filter(item => item.value);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 pb-4">
        {/* Case Information - Collapsible Card */}
        <Collapsible open={caseInfoOpen} onOpenChange={setCaseInfoOpen}>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer active:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-sky-500" />
                  </div>
                  <span className="font-semibold text-slate-900">Case Information</span>
                </div>
                {caseInfoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {caseInfoItems.map((item: CaseInfoItem, index) => (
                  <div key={index} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500 flex-shrink-0">{item.label}</span>
                    <div className="text-right ml-3">
                      {item.isEditable && item.editComponent ? (
                        item.editComponent
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Acts and Sections */}
                {caseData?.fetched_data?.data?.acts_and_sections_details && 
                 Array.isArray(caseData.fetched_data.data.acts_and_sections_details) && 
                 caseData.fetched_data.data.acts_and_sections_details.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Acts & Sections</p>
                    <div className="space-y-2">
                      {caseData.fetched_data.data.acts_and_sections_details.map((act: any, index: number) => (
                        <div key={index} className="bg-sky-50 rounded-xl p-3">
                          {act.under_act && <p className="text-sm font-medium text-slate-900">{act.under_act}</p>}
                          {act.under_section && <p className="text-xs text-slate-600 mt-1">Section: {act.under_section}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Nested Tabs - iOS Style Horizontal Scroll */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={nestedTab} onValueChange={setNestedTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide border-b border-slate-100">
              <TabsList className="inline-flex w-max bg-transparent p-2 gap-2">
                {nestedTabs.map(tab => {
                  const IconComponent = tab.icon;
                  const isActive = nestedTab === tab.value;
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                        isActive 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="parties" className="m-0">
                <div className="space-y-6">
                  {/* Petitioners */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Petitioners</p>
                    {petitioners && petitioners.length > 0 ? (
                      <div className="space-y-3">
                        {petitioners.map((petitioner, index) => (
                          <div key={index} className="bg-sky-50 rounded-xl p-3 border-l-4 border-sky-500">
                            <p className="text-sm font-medium text-slate-900">
                              {index + 1}. {parseName(petitioner.petitioner_name || petitioner.name)}
                            </p>
                            {petitioner.advocate_name && (
                              <p className="text-xs text-slate-500 mt-1">
                                Adv: {parseAdvocates(petitioner.advocate_name)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No petitioners listed</p>
                    )}
                  </div>

                  {/* Respondents */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Respondents</p>
                    {respondents && respondents.length > 0 ? (
                      <div className="space-y-3">
                        {respondents.map((respondent, index) => (
                          <div key={index} className="bg-rose-50 rounded-xl p-3 border-l-4 border-rose-500">
                            <p className="text-sm font-medium text-slate-900">
                              {index + 1}. {parseName(respondent.respondent_name || respondent.name)}
                            </p>
                            {respondent.advocate_name && (
                              <p className="text-xs text-slate-500 mt-1">
                                Adv: {parseAdvocates(respondent.advocate_name)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No respondents listed</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="m-0">
                <DocumentsTable documents={documents} />
              </TabsContent>

              <TabsContent value="orders" className="m-0">
                <OrdersTable orders={orders} />
              </TabsContent>

              <TabsContent value="hearings" className="m-0">
                <HearingsTable hearings={hearings} />
              </TabsContent>

              <TabsContent value="objections" className="m-0">
                <ObjectionsTable objections={objections} />
              </TabsContent>

              <TabsContent value="ia-details" className="m-0">
                <IADetailsTable iaDetails={iaDetails} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  // Desktop Layout (unchanged)
  return (
    <div className="space-y-6">
      {/* Case Information Card */}
      <Collapsible open={caseInfoOpen} onOpenChange={setCaseInfoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>Case Information</CardTitle>
                </div>
                {caseInfoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {caseInfoItems.map((item: CaseInfoItem, index) => (
                  <div key={index}>
                    <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                    {item.isEditable && item.editComponent ? (
                      item.editComponent
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Acts and Sections - District Court Specific */}
              {caseData?.fetched_data?.data?.acts_and_sections_details && 
               Array.isArray(caseData.fetched_data.data.acts_and_sections_details) && 
               caseData.fetched_data.data.acts_and_sections_details.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                    Acts & Sections
                  </h4>
                  <div className="space-y-2">
                    {caseData.fetched_data.data.acts_and_sections_details.map((act: any, index: number) => (
                      <div key={index} className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                        {act.under_act && (
                          <p className="text-sm font-medium text-slate-900">{act.under_act}</p>
                        )}
                        {act.under_section && (
                          <p className="text-xs text-slate-600 mt-1">Section: {act.under_section}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Nested Tabs Section */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={nestedTab} onValueChange={setNestedTab} className="w-full">
            <TabsList className="w-full bg-slate-50 border-b border-slate-200 h-auto p-0 rounded-none">
              <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
                {nestedTabs.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-sky-50 bg-transparent rounded-none whitespace-nowrap transition-colors"
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label === 'Parties' ? 'Parties & Advocates' : tab.label === 'Docs' ? 'Documents' : tab.label === 'IA' ? 'IA Details' : tab.label}
                    </TabsTrigger>
                  );
                })}
              </div>
            </TabsList>

            <div className="p-6">
              <TabsContent value="parties" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Petitioners */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                      Petitioners
                    </h4>
                    {petitioners && petitioners.length > 0 ? (
                      <div className="space-y-4">
                        {petitioners.map((petitioner, index) => (
                          <div key={index} className="border-l-2 border-sky-500 pl-3">
                            <p className="text-sm font-medium text-slate-900">
                              {index + 1}. {parseName(petitioner.petitioner_name || petitioner.name)}
                            </p>
                            {petitioner.advocate_name && (
                              <p className="text-xs text-slate-500 mt-1">
                                Advocate: {parseAdvocates(petitioner.advocate_name)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No petitioners listed</p>
                    )}
                  </div>

                  {/* Respondents */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                      Respondents
                    </h4>
                    {respondents && respondents.length > 0 ? (
                      <div className="space-y-4">
                        {respondents.map((respondent, index) => (
                          <div key={index} className="border-l-2 border-rose-500 pl-3">
                            <p className="text-sm font-medium text-slate-900">
                              {index + 1}. {parseName(respondent.respondent_name || respondent.name)}
                            </p>
                            {respondent.advocate_name && (
                              <p className="text-xs text-slate-500 mt-1">
                                Advocate: {parseAdvocates(respondent.advocate_name)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No respondents listed</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="m-0">
                <DocumentsTable documents={documents} />
              </TabsContent>

              <TabsContent value="orders" className="m-0">
                <OrdersTable orders={orders} />
              </TabsContent>

              <TabsContent value="hearings" className="m-0">
                <HearingsTable hearings={hearings} />
              </TabsContent>

              <TabsContent value="objections" className="m-0">
                <ObjectionsTable objections={objections} />
              </TabsContent>

              <TabsContent value="ia-details" className="m-0">
                <IADetailsTable iaDetails={iaDetails} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};