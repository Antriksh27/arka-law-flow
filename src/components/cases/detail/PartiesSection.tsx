import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Scale } from 'lucide-react';
import { parsePartyString } from '@/lib/partyParser';

interface PartiesSectionProps {
  petitionerString: string | null;
  respondentString: string | null;
}

export const PartiesSection: React.FC<PartiesSectionProps> = ({
  petitionerString,
  respondentString
}) => {
  const petitioners = parsePartyString(petitionerString);
  const respondents = parsePartyString(respondentString);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Petitioners Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
        <CardHeader className="border-b border-[#E5E7EB]">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#1F2937]">
            <Users className="w-5 h-5 text-[#1E3A8A]" />
            Petitioner(s) & Advocate(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {petitioners.length > 0 ? (
            <div className="space-y-4">
              {petitioners.map((party, idx) => (
                <div key={idx} className="pl-4 border-l-4 border-[#1E3A8A]">
                  <p className="font-semibold text-[#111827] mb-2">{party.name}</p>
                  {party.advocates.length > 0 && (
                    <ul className="space-y-1">
                      {party.advocates.map((advocate, advIdx) => (
                        <li key={advIdx} className="text-sm text-[#6B7280] flex items-start">
                          <span className="mr-2">•</span>
                          <span>{advocate}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] italic">No petitioner information available</p>
          )}
        </CardContent>
      </Card>

      {/* Respondents Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
        <CardHeader className="border-b border-[#E5E7EB]">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#1F2937]">
            <Scale className="w-5 h-5 text-[#1E3A8A]" />
            Respondent(s) & Advocate(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {respondents.length > 0 ? (
            <div className="space-y-4">
              {respondents.map((party, idx) => (
                <div key={idx} className="pl-4 border-l-4 border-[#E5E7EB]">
                  <p className="font-semibold text-[#111827] mb-2">{party.name}</p>
                  {party.advocates.length > 0 && (
                    <ul className="space-y-1">
                      {party.advocates.map((advocate, advIdx) => (
                        <li key={advIdx} className="text-sm text-[#6B7280] flex items-start">
                          <span className="mr-2">•</span>
                          <span>{advocate}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] italic">No respondent information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
