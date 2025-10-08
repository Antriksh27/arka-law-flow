import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface CategoryIACardsProps {
  caseData: any;
  iaDetails: any[];
}

export const CategoryIACards = ({ caseData, iaDetails }: CategoryIACardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white shadow-sm border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Category Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-[#6B7280]">Category</div>
              <div className="text-base font-medium text-[#111827]">
                {caseData?.category || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#6B7280]">Sub Category</div>
              <div className="text-base font-medium text-[#111827]">
                {caseData?.sub_category || 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
            <FileText className="h-5 w-5" />
            IA Details ({iaDetails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {iaDetails.length > 0 ? (
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {iaDetails.map((ia) => (
                <div key={ia.id} className="border-b border-[#E5E7EB] pb-2 last:border-0">
                  <div className="text-sm font-medium text-[#111827]">
                    {ia.ia_number || 'N/A'}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    Party: {ia.party || 'N/A'}
                  </div>
                  {ia.date_of_filing && (
                    <div className="text-xs text-[#6B7280]">
                      Filed: {format(new Date(ia.date_of_filing), 'dd-MM-yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#6B7280]">No IA details available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
