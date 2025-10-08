import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay } from '@/lib/caseDataFormatter';
import { useState } from 'react';

interface IADetailsCardProps {
  iaDetails: any[];
}

export const IADetailsCard = ({ iaDetails }: IADetailsCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filter out empty IA details
  const validIADetails = iaDetails.filter(ia => 
    ia.ia_number || ia.party || ia.date_of_filing
  );

  if (validIADetails.length === 0) {
    return null; // Don't render if no valid IA details
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white shadow-sm border-[#E5E7EB] rounded-2xl">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
            <CardTitle className="text-xl font-semibold text-[#111827] flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              IA Details ({validIADetails.length})
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {validIADetails.map((ia, index) => (
                <div key={index} className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#111827]">
                      {ia.ia_number || `IA #${index + 1}`}
                    </span>
                    <Badge variant={ia.ia_status === 'Pending' ? 'outline' : 'default'}>
                      {ia.ia_status || 'Pending'}
                    </Badge>
                  </div>
                  
                  {ia.party && (
                    <div className="text-sm text-[#6B7280] mb-2">
                      Party: {ia.party}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {ia.date_of_filing && (
                      <div>
                        <span className="text-[#6B7280]">Filing Date:</span>
                        <div className="font-medium text-[#111827]">
                          {formatDateDisplay(ia.date_of_filing)}
                        </div>
                      </div>
                    )}
                    {ia.next_date && (
                      <div>
                        <span className="text-[#6B7280]">Next Date:</span>
                        <div className="font-medium text-[#111827]">
                          {formatDateDisplay(ia.next_date)}
                        </div>
                      </div>
                    )}
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
