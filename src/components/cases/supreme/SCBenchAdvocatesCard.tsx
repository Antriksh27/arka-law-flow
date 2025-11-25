import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Users } from 'lucide-react';

interface SCBenchAdvocatesCardProps {
  legalkartCase: any;
}

export const SCBenchAdvocatesCard = ({ legalkartCase }: SCBenchAdvocatesCardProps) => {
  const caseDetails = legalkartCase?.case_details || {};
  const benchComposition = legalkartCase?.bench_composition || [];
  
  // Parse advocates from case_details
  const petitionerAdvocates = caseDetails['Petitioner Advocate(s)'] || 'N/A';
  const respondentAdvocates = caseDetails['Respondent Advocate(s)'] || 'N/A';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Bench Composition & Advocates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bench Composition */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Bench
            </div>
            <div className="space-y-2">
              {benchComposition.length > 0 ? (
                benchComposition.map((judge: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Scale className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{judge}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">Not available</span>
              )}
            </div>
          </div>

          {/* Advocates */}
          <div className="space-y-4">
            {/* Petitioner Advocates */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Petitioner Advocate(s)
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="text-sm whitespace-pre-line">
                  {petitionerAdvocates}
                </p>
              </div>
            </div>

            {/* Respondent Advocates */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Respondent Advocate(s)
              </div>
              <div className="border-l-2 border-red-500 pl-3">
                <p className="text-sm whitespace-pre-line">
                  {respondentAdvocates}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
