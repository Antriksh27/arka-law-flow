import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileText, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay, formatAdvocateName, formatPartyName } from '@/lib/caseDataFormatter';

interface DetailsTabProps {
  caseData: any;
  legalkartData: any;
  petitioners: any[];
  respondents: any[];
  iaDetails: any[];
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ 
  caseData, 
  legalkartData,
  petitioners,
  respondents,
  iaDetails 
}) => {
  const [caseInfoOpen, setCaseInfoOpen] = useState(true);
  const [partiesOpen, setPartiesOpen] = useState(true);
  const [iaOpen, setIaOpen] = useState(false);

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

  // Filter out invalid IA details
  const validIaDetails = iaDetails.filter(ia => 
    ia.ia_number || ia.party || ia.date_of_filing
  );

  return (
    <div className="space-y-4">
      {/* Case Information Card */}
      <Collapsible open={caseInfoOpen} onOpenChange={setCaseInfoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle>Case Information</CardTitle>
                </div>
                {caseInfoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Filing Number', value: legalkartData?.filing_number || caseData?.filing_number },
                  { label: 'Filing Date', value: formatDate(legalkartData?.filing_date || caseData?.filing_date) },
                  { label: 'Registration Number', value: legalkartData?.registration_number || caseData?.registration_number },
                  { label: 'Registration Date', value: formatDate(legalkartData?.registration_date || caseData?.registration_date) },
                  { label: 'CNR Number', value: legalkartData?.cnr_number || caseData?.cnr_number },
                  { label: 'Stage of Case', value: legalkartData?.stage_of_case || caseData?.stage },
                  { label: 'Next Hearing Date', value: formatDate(legalkartData?.next_hearing_date || caseData?.next_hearing_date) },
                  { label: 'Coram', value: legalkartData?.coram || caseData?.coram },
                  { label: 'Bench Type', value: legalkartData?.bench_type || caseData?.bench_type },
                  { label: 'Judicial Branch', value: legalkartData?.judicial_branch },
                  { label: 'State', value: legalkartData?.state || caseData?.state },
                  { label: 'District', value: legalkartData?.district || caseData?.district },
                  { label: 'Court Name', value: caseData?.court_name },
                  { label: 'Category', value: legalkartData?.category || caseData?.category },
                  { label: 'Sub-Category', value: legalkartData?.sub_category || caseData?.sub_category },
                ].filter(item => item.value).map((item, index) => (
                  <div key={index}>
                    <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Parties & Advocates Card */}
      <Collapsible open={partiesOpen} onOpenChange={setPartiesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle>Parties & Advocates</CardTitle>
                </div>
                {partiesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Petitioners */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Petitioners
                  </h4>
                  {petitioners && petitioners.length > 0 ? (
                    <div className="space-y-4">
                      {petitioners.map((petitioner, index) => (
                        <div key={index} className="border-l-2 border-blue-500 pl-3">
                           <p className="text-sm font-medium text-gray-900">
                             {index + 1}. {parseName(petitioner.petitioner_name || petitioner.name)}
                           </p>
                          {petitioner.advocate_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Advocate: {parseAdvocates(petitioner.advocate_name)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No petitioners listed</p>
                  )}
                </div>

                {/* Respondents */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Respondents
                  </h4>
                  {respondents && respondents.length > 0 ? (
                    <div className="space-y-4">
                      {respondents.map((respondent, index) => (
                        <div key={index} className="border-l-2 border-red-500 pl-3">
                           <p className="text-sm font-medium text-gray-900">
                             {index + 1}. {parseName(respondent.respondent_name || respondent.name)}
                           </p>
                          {respondent.advocate_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Advocate: {parseAdvocates(respondent.advocate_name)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No respondents listed</p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* IA Details Card */}
      {validIaDetails.length > 0 && (
        <Collapsible open={iaOpen} onOpenChange={setIaOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <CardTitle>IA Details ({validIaDetails.length})</CardTitle>
                  </div>
                  {iaOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {validIaDetails.map((ia, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">IA Number</p>
                          <p className="text-sm font-medium">{ia.ia_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Party</p>
                          <p className="text-sm font-medium">{ia.party || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Filing Date</p>
                          <p className="text-sm font-medium">{formatDate(ia.date_of_filing)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <Badge variant={ia.ia_status === 'Pending' ? 'outline' : 'default'}>
                            {ia.ia_status || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};
