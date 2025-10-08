import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Scale, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface CaseOverviewSectionProps {
  caseData: any;
  legalKartData?: any;
}

export const CaseOverviewSection: React.FC<CaseOverviewSectionProps> = ({
  caseData,
  legalKartData
}) => {
  const displayData = { ...caseData, ...legalKartData };

  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] mb-6">
      <CardHeader className="border-b border-[#E5E7EB]">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#1F2937]">
          <FileText className="w-5 h-5 text-[#1E3A8A]" />
          Case Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Case Numbers */}
          <div className="space-y-4">
            {displayData.cnr_number && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">CNR Number</p>
                <p className="font-mono text-base text-[#111827] font-semibold">
                  {displayData.cnr_number}
                </p>
              </div>
            )}
            {displayData.filing_number && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Filing Number</p>
                <p className="text-base text-[#111827]">{displayData.filing_number}</p>
              </div>
            )}
            {displayData.registration_number && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Registration Number</p>
                <p className="text-base text-[#111827]">{displayData.registration_number}</p>
              </div>
            )}
          </div>

          {/* Column 2: Dates & Category */}
          <div className="space-y-4">
            {displayData.filing_date && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Filing Date</p>
                <p className="text-base text-[#111827]">
                  {format(new Date(displayData.filing_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {displayData.registration_date && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Registration Date</p>
                <p className="text-base text-[#111827]">
                  {format(new Date(displayData.registration_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {displayData.category && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Category</p>
                <Badge variant="outline" className="mt-1">
                  {displayData.category}
                </Badge>
              </div>
            )}
          </div>

          {/* Column 3: Court & Status */}
          <div className="space-y-4">
            {displayData.stage_of_case && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Stage</p>
                <p className="text-base text-[#111827]">{displayData.stage_of_case}</p>
              </div>
            )}
            {displayData.next_hearing_date && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Next Hearing Date</p>
                <Badge className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(displayData.next_hearing_date), 'MMM dd, yyyy')}
                </Badge>
              </div>
            )}
            {displayData.bench_type && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Bench Type</p>
                <p className="text-base text-[#111827]">{displayData.bench_type}</p>
              </div>
            )}
            {displayData.coram && (
              <div>
                <p className="text-sm text-[#6B7280] font-medium">Judge</p>
                <p className="text-base text-[#111827]">{displayData.coram}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
