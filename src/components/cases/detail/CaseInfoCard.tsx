import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileText } from 'lucide-react';
import { formatDateDisplay } from '@/lib/caseDataFormatter';
import { useState } from 'react';

interface CaseInfoCardProps {
  caseData: any;
}

export const CaseInfoCard = ({ caseData }: CaseInfoCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const infoItems = [
    { label: 'Reference Number', value: caseData?.reference_number },
    { label: 'By/Against', value: caseData?.by_against ? caseData.by_against.charAt(0).toUpperCase() + caseData.by_against.slice(1) : null },
    { label: 'Filing Number', value: caseData?.filing_number },
    { label: 'Filing Date', value: formatDateDisplay(caseData?.filing_date) },
    { label: 'Registration Number', value: caseData?.registration_number },
    { label: 'Registration Date', value: formatDateDisplay(caseData?.registration_date) },
    { label: 'CNR Number', value: caseData?.cnr_number },
    { label: 'Coram', value: caseData?.coram },
    { label: 'Bench Type', value: caseData?.bench_type },
    { label: 'Judicial Branch', value: caseData?.judicial_branch },
    { label: 'State', value: caseData?.state },
    { label: 'District', value: caseData?.district },
    { label: 'Court', value: caseData?.court_name || caseData?.court },
    { label: 'Category', value: caseData?.category },
    { label: 'Sub Category', value: caseData?.sub_category },
  ].filter(item => item.value); // Only show items with values

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white shadow-sm border-[#E5E7EB] rounded-2xl">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
            <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Information
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {infoItems.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-sm text-[#6B7280]">{item.label}</div>
                  <div className="text-base font-medium text-[#111827]">
                    {item.value || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
