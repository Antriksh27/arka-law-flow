import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { formatPartyName, formatAdvocateName } from '@/lib/caseDataFormatter';

interface PartiesCardsProps {
  petitioners: any[];
  respondents: any[];
}

export const PartiesCards = ({ petitioners, respondents }: PartiesCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white shadow-sm border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
            <Users className="h-5 w-5" />
            Petitioners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {petitioners.length > 0 ? (
            <div className="space-y-4">
              {petitioners.map((petitioner, idx) => (
                <div key={petitioner.id} className="border-b border-[#E5E7EB] pb-3 last:border-0">
                  <div className="text-base font-medium text-[#111827]">
                    {idx + 1}. {formatPartyName(petitioner.petitioner_name)}
                  </div>
                  {petitioner.advocate_name && (
                    <div className="text-sm text-[#6B7280] mt-1 ml-4">
                      Advocate: {formatAdvocateName(petitioner.advocate_name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#6B7280]">No petitioners found</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
            <Users className="h-5 w-5" />
            Respondents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {respondents.length > 0 ? (
            <div className="space-y-4">
              {respondents.map((respondent, idx) => (
                <div key={respondent.id} className="border-b border-[#E5E7EB] pb-3 last:border-0">
                  <div className="text-base font-medium text-[#111827]">
                    {idx + 1}. {formatPartyName(respondent.respondent_name)}
                  </div>
                  {respondent.advocate_name && (
                    <div className="text-sm text-[#6B7280] mt-1 ml-4">
                      Advocate: {formatAdvocateName(respondent.advocate_name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#6B7280]">No respondents found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
