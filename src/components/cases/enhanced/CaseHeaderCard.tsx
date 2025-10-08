import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface CaseHeaderCardProps {
  caseData: any;
}

export const CaseHeaderCard = ({ caseData }: CaseHeaderCardProps) => {
  if (!caseData) return null;

  return (
    <Card className="bg-white shadow-sm border-[#E5E7EB] sticky top-0 z-10">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-[#6B7280] mb-1">Filing Number</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.filing_number || 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-[#6B7280] mb-1">Registration Number</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.registration_number || 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-[#6B7280] mb-1">CNR Number</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.cnr_number || 'N/A'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-sm text-[#6B7280] mb-1">Coram</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.coram || 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-[#6B7280] mb-1">Stage of Case</div>
            <Badge variant="outline" className="mt-1">
              {caseData.stage_of_case || 'Unknown'}
            </Badge>
          </div>
          
          <div>
            <div className="text-sm text-[#6B7280] mb-1">Next Hearing Date</div>
            <div className="text-base font-medium text-[#1E3A8A]">
              {caseData.next_hearing_date 
                ? format(new Date(caseData.next_hearing_date), 'dd-MM-yyyy')
                : 'Not scheduled'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-sm text-[#6B7280] mb-1">Bench Type</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.bench_type || 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-[#6B7280] mb-1">State</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.state || 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-[#6B7280] mb-1">District</div>
            <div className="text-base font-medium text-[#111827]">
              {caseData.district || 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
