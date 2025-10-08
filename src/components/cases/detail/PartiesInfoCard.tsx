import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Users } from 'lucide-react';
import { formatPartyName, formatAdvocateName } from '@/lib/caseDataFormatter';
import { useState } from 'react';

interface PartiesInfoCardProps {
  petitioners: any[];
  respondents: any[];
}

export const PartiesInfoCard = ({ petitioners, respondents }: PartiesInfoCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white shadow-sm border-[#E5E7EB] rounded-2xl">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
            <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parties & Advocates
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Petitioners */}
              <div>
                <h3 className="text-base font-semibold text-[#111827] mb-3 pb-2 border-b border-[#E5E7EB]">
                  Petitioners ({petitioners.length})
                </h3>
                {petitioners.length > 0 ? (
                  <div className="space-y-3">
                    {petitioners.map((petitioner, index) => (
                      <div key={index} className="pl-4 border-l-2 border-[#1E3A8A]">
                        <div className="text-sm font-medium text-[#111827]">
                          {index + 1}. {formatPartyName(petitioner.petitioner_name || petitioner.name)}
                        </div>
                        {(petitioner.advocate_name || petitioner.advocate) && (
                          <div className="text-xs text-[#6B7280] mt-1">
                            Advocate: {formatAdvocateName(petitioner.advocate_name || petitioner.advocate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#6B7280]">No petitioners listed</div>
                )}
              </div>

              {/* Respondents */}
              <div>
                <h3 className="text-base font-semibold text-[#111827] mb-3 pb-2 border-b border-[#E5E7EB]">
                  Respondents ({respondents.length})
                </h3>
                {respondents.length > 0 ? (
                  <div className="space-y-3">
                    {respondents.map((respondent, index) => (
                      <div key={index} className="pl-4 border-l-2 border-[#DC2626]">
                        <div className="text-sm font-medium text-[#111827]">
                          {index + 1}. {formatPartyName(respondent.respondent_name || respondent.name)}
                        </div>
                        {(respondent.advocate_name || respondent.advocate) && (
                          <div className="text-xs text-[#6B7280] mt-1">
                            Advocate: {formatAdvocateName(respondent.advocate_name || respondent.advocate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#6B7280]">No respondents listed</div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
