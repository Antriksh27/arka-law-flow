import { Card, CardContent } from '@/components/ui/card';
import { User, Users } from 'lucide-react';
import type { ParsedSCData } from '@/lib/scCaseDataParser';

interface SCPartiesSectionProps {
  data: ParsedSCData;
}

export const SCPartiesSection = ({ data }: SCPartiesSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Petitioners */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Petitioner(s)
          </h3>
          
          {data.petitioners && data.petitioners.length > 0 ? (
            <div className="space-y-4">
              {data.petitioners.map((petitioner, idx) => (
                <div key={idx} className="border-l-2 border-primary/50 pl-4 py-2">
                  <div className="font-semibold text-foreground">
                    {idx + 1}. {petitioner.name}
                  </div>
                  {petitioner.advocates && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Advocate:</span> {petitioner.advocates}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {data.petitioner || 'No petitioner information available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Respondents */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Respondent(s)
          </h3>
          
          {data.respondents && data.respondents.length > 0 ? (
            <div className="space-y-4">
              {data.respondents.map((respondent, idx) => (
                <div key={idx} className="border-l-2 border-muted-foreground/50 pl-4 py-2">
                  <div className="font-semibold text-foreground">
                    {idx + 1}. {respondent.name}
                  </div>
                  {respondent.advocates && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Advocate:</span> {respondent.advocates}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {data.respondent || 'No respondent information available'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
